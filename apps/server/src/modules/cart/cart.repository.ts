import { CartItem } from '@entities/cart-item.entity'

import AppDataSource from '@databases/data-source'

class CartRepository {
  // Thứ tự theo lúc thêm vào giỏ; sản phẩm đã xoá mềm không được join nên bị lọc ở service
  static findByUser(userId: string) {
    return this.cartItemRepo.find({
      where: { userId },
      relations: { product: { category: true } },
      order: { createdAt: 'ASC', id: 'ASC' }
    })
  }

  static findItem(userId: string, productId: string) {
    return this.cartItemRepo.findOne({ where: { userId, productId } })
  }

  static countItems(userId: string) {
    return this.cartItemRepo.count({ where: { userId } })
  }

  // Thêm dòng mới hoặc ghi đè số lượng của dòng đã có
  static async setQuantity(userId: string, productId: string, quantity: number) {
    await this.cartItemRepo.upsert({ userId, productId, quantity }, ['userId', 'productId'])
  }

  static async removeItem(userId: string, productId: string) {
    await this.cartItemRepo.delete({ userId, productId })
  }

  static async clear(userId: string) {
    await this.cartItemRepo.delete({ userId })
  }

  private static get cartItemRepo() {
    return AppDataSource.getDataSource().getRepository(CartItem)
  }
}

export default CartRepository
