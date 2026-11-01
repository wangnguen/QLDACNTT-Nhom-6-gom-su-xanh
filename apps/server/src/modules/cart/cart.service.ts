import { MAX_CART_ITEM_QUANTITY, MAX_CART_ITEMS } from '@common/constants'
import { BadRequestError, NotFoundError } from '@common/errors'
import { Cart } from '@common/types'

import ProductRepository from '@modules/product/product.repository'

import { Product } from '@entities/product.entity'

import { toCart } from './cart.mapper'
import CartRepository from './cart.repository'
import { AddCartItemBody, UpdateCartItemBody } from './dto'

// US-10: Quản lý giỏ hàng — giỏ lưu trên server theo tài khoản, luôn trả về cả giỏ sau mỗi thao tác
class CartService {
  static async getCart(userId: string): Promise<Cart> {
    const items = await CartRepository.findByUser(userId)
    // Sản phẩm đã xoá thì relation không load được — bỏ qua dòng đó
    return toCart(items.filter((item) => item.product))
  }

  // Thêm sản phẩm đã có trong giỏ thì cộng dồn số lượng
  static async addItem(userId: string, { productId, quantity }: AddCartItemBody): Promise<Cart> {
    const [product, existing] = await Promise.all([
      this.findPurchasableProduct(productId),
      CartRepository.findItem(userId, productId)
    ])

    if (!existing && (await CartRepository.countItems(userId)) >= MAX_CART_ITEMS) {
      throw new BadRequestError(`Giỏ hàng chỉ chứa tối đa ${MAX_CART_ITEMS} sản phẩm khác nhau`)
    }

    const inCart = existing?.quantity ?? 0
    this.ensureQuantityAllowed(product, inCart + quantity, inCart)

    await CartRepository.setQuantity(userId, productId, inCart + quantity)
    return this.getCart(userId)
  }

  static async updateItem(userId: string, productId: string, { quantity }: UpdateCartItemBody): Promise<Cart> {
    const existing = await CartRepository.findItem(userId, productId)
    if (!existing) throw new NotFoundError('Sản phẩm không có trong giỏ hàng')

    const product = await this.findPurchasableProduct(productId)
    this.ensureQuantityAllowed(product, quantity)

    await CartRepository.setQuantity(userId, productId, quantity)
    return this.getCart(userId)
  }

  // Xoá sản phẩm không có trong giỏ cũng coi là thành công (bấm xoá hai lần không báo lỗi)
  static async removeItem(userId: string, productId: string): Promise<Cart> {
    await CartRepository.removeItem(userId, productId)
    return this.getCart(userId)
  }

  static async clear(userId: string): Promise<Cart> {
    await CartRepository.clear(userId)
    return toCart([])
  }

  private static async findPurchasableProduct(productId: string) {
    const product = await ProductRepository.findById(productId)
    if (!product) throw new NotFoundError('Không tìm thấy sản phẩm')
    if (!product.isActive || !product.category.isActive) throw new BadRequestError('Sản phẩm đã ngừng bán')
    if (product.stock === 0) throw new BadRequestError('Sản phẩm đã hết hàng')
    return product
  }

  private static ensureQuantityAllowed(product: Product, quantity: number, inCart = 0) {
    if (quantity > MAX_CART_ITEM_QUANTITY) {
      throw new BadRequestError(
        `Mỗi sản phẩm chỉ mua tối đa ${MAX_CART_ITEM_QUANTITY}` + (inCart ? `, giỏ hàng của bạn đã có ${inCart}` : '')
      )
    }
    if (quantity > product.stock) {
      throw new BadRequestError(
        `Chỉ còn ${product.stock} sản phẩm` + (inCart ? `, giỏ hàng của bạn đã có ${inCart}` : '')
      )
    }
  }
}

export default CartService
