import 'dotenv/config'

import { logger } from '@common/config'
import { slugify } from '@common/utils/slug'

import { Category } from '@entities/category.entity'
import { Product } from '@entities/product.entity'
import { Workshop } from '@entities/workshop.entity'

import AppDataSource from '@databases/data-source'

type SampleProduct = Pick<Product, 'name' | 'price' | 'stock' | 'material' | 'dimensions' | 'description' | 'imageUrls'>

type SampleCategory = Pick<Category, 'name' | 'description' | 'imageUrl'> & { products: SampleProduct[] }

type SampleWorkshop = Pick<
  Workshop,
  | 'name'
  | 'description'
  | 'instructor'
  | 'location'
  | 'startsAt'
  | 'endsAt'
  | 'registrationDeadline'
  | 'price'
  | 'capacity'
  | 'imageUrls'
>

// Ảnh lấy từ Wikimedia Commons (CC0 / CC BY / CC BY-SA) — chỉ dùng làm dữ liệu chạy thử, thay bằng ảnh thật khi lên production
const wiki = (path: string) => `https://thumb.wikimedia.org/wikipedia/commons/thumb/${path}`

// Dữ liệu mẫu để chạy thử trang client/admin
const SAMPLE_CATALOG: SampleCategory[] = [
  {
    name: 'Bình hoa',
    description: 'Bình cắm hoa men lam, men rạn thủ công Bát Tràng',
    imageUrl: wiki('2/2f/Gom-su-vu-hoa.jpg/960px-Gom-su-vu-hoa.jpg'),
    products: [
      {
        name: 'Bình hoa men lam vẽ sen',
        price: 450000,
        stock: 20,
        material: 'Gốm men lam',
        dimensions: 'Cao 30cm, miệng 10cm',
        description:
          'Bình hoa men lam vẽ tay hoạ tiết hoa sen, nung ở 1.300°C. Hợp cắm sen, cúc hoặc cành đào ngày Tết.',
        imageUrls: [
          wiki(
            'a/af/Vase%2C_Bat_Trang_ceramic_with_blue_glaze_-_Nguyen_dynasty%2C_19th_century_AD_-_Vietnam_National_Museum_of_Fine_Arts_-_Hanoi%2C_Vietnam_-_DSC05325.JPG/960px-Vase%2C_Bat_Trang_ceramic_with_blue_glaze_-_Nguyen_dynasty%2C_19th_century_AD_-_Vietnam_National_Museum_of_Fine_Arts_-_Hanoi%2C_Vietnam_-_DSC05325.JPG'
          ),
          wiki(
            '0/05/Vase_decorated_with_Fisherman_Benefits_legend%2C_Bat_Trang_ceramic_-_Nguyen_dynasty%2C_19th_century_AD_-_Vietnam_National_Museum_of_Fine_Arts_-_Hanoi%2C_Vietnam_-_DSC05328.JPG/960px-thumbnail.jpg'
          )
        ]
      },
      {
        name: 'Bình hoa men rạn cổ',
        price: 680000,
        stock: 8,
        material: 'Gốm men rạn',
        dimensions: 'Cao 35cm, thân 18cm',
        description: 'Lớp men rạn chân chim tạo từ kỹ thuật làm nguội nhanh — mỗi chiếc có vết rạn khác nhau.',
        imageUrls: [
          wiki(
            'f/f7/Pot%2C_crackle_glaze_ceramic_-_15th-16th_century_AD_-_Vietnam_National_Museum_of_Fine_Arts_-_Hanoi%2C_Vietnam_-_DSC05337.JPG/960px-Pot%2C_crackle_glaze_ceramic_-_15th-16th_century_AD_-_Vietnam_National_Museum_of_Fine_Arts_-_Hanoi%2C_Vietnam_-_DSC05337.JPG'
          ),
          wiki(
            '4/4f/Pot%2C_crackle_glaze_ceramic_-_15th-16th_century_AD_-_Vietnam_National_Museum_of_Fine_Arts_-_Hanoi%2C_Vietnam_-_DSC05340.JPG/960px-Pot%2C_crackle_glaze_ceramic_-_15th-16th_century_AD_-_Vietnam_National_Museum_of_Fine_Arts_-_Hanoi%2C_Vietnam_-_DSC05340.JPG'
          )
        ]
      },
      {
        name: 'Bình hoa dáng tỏi men xanh ngọc',
        price: 520000,
        stock: 12,
        material: 'Gốm men ngọc',
        dimensions: 'Cao 28cm',
        description: 'Dáng tỏi cổ điển, men xanh ngọc trong, hợp đặt trên bàn trà hoặc kệ sách.',
        imageUrls: [
          wiki(
            'a/a6/Southern_Song_Longquan_Ware_Celadon_Vase_2.jpg/960px-Southern_Song_Longquan_Ware_Celadon_Vase_2.jpg'
          ),
          wiki(
            '4/49/Southern_Song_Longquan_Ware_Celadon_Vase_1.jpg/960px-Southern_Song_Longquan_Ware_Celadon_Vase_1.jpg'
          )
        ]
      },
      {
        name: 'Bình hoa mini men nâu',
        price: 150000,
        stock: 2,
        material: 'Gốm men nâu',
        dimensions: 'Cao 12cm',
        description: 'Bình nhỏ để bàn làm việc, cắm một vài cành hoa khô hoặc cỏ lau.',
        imageUrls: [
          wiki('d/d7/Vase_by_Bat_Trang_ceramic_for_pickling_2.JPG/960px-Vase_by_Bat_Trang_ceramic_for_pickling_2.JPG'),
          wiki(
            '7/7f/Grain_jar_from_Vietnam%2C_Thanh_Hoa%2C_11th-12th_century%2C_porcelain_with_crackled_glaze%2C_HAA.JPG/960px-Grain_jar_from_Vietnam%2C_Thanh_Hoa%2C_11th-12th_century%2C_porcelain_with_crackled_glaze%2C_HAA.JPG'
          )
        ]
      }
    ]
  },
  {
    name: 'Bát đĩa',
    description: 'Bát, đĩa, tô dùng hằng ngày — an toàn với lò vi sóng và máy rửa bát',
    imageUrl: wiki(
      '9/90/Bowl%2C_made_in_China_for_export_and_collected_in_the_Philippines%2C_15th_century%2C_porcelain_with_underglaze_cobalt_blue_floral_design.JPG/960px-Bowl%2C_made_in_China_for_export_and_collected_in_the_Philippines%2C_15th_century%2C_porcelain_with_underglaze_cobalt_blue_floral_design.JPG'
    ),
    products: [
      {
        name: 'Bộ 6 bát cơm men lam',
        price: 360000,
        stock: 30,
        material: 'Gốm men lam',
        dimensions: 'Đường kính 11,5cm',
        description: 'Bộ 6 bát cơm vẽ hoạ tiết dây lá, men dày, không chì.',
        imageUrls: [
          wiki(
            '0/02/Klokvormige_kom_met_bloemranken%2C_AK-RAK-1971-7.jpg/960px-Klokvormige_kom_met_bloemranken%2C_AK-RAK-1971-7.jpg'
          ),
          wiki('8/87/Bowl_MET_DP235021.jpg/960px-Bowl_MET_DP235021.jpg')
        ]
      },
      {
        name: 'Đĩa tròn men rêu 26cm',
        price: 220000,
        stock: 18,
        material: 'Gốm men rêu',
        dimensions: 'Đường kính 26cm',
        description: 'Đĩa bày món chính, men xanh rêu loang tự nhiên sau khi nung.',
        imageUrls: [
          wiki(
            '9/93/Dish_with_floral_design_with_celadon_crackle_glaze_-_Vanderbilt_Fine_Arts_Gallery_-_1994.180.JPG/960px-Dish_with_floral_design_with_celadon_crackle_glaze_-_Vanderbilt_Fine_Arts_Gallery_-_1994.180.JPG'
          )
        ]
      },
      {
        name: 'Tô canh men trắng ngà',
        price: 190000,
        stock: 0,
        material: 'Gốm men trắng',
        dimensions: 'Đường kính 20cm, cao 9cm',
        description: 'Tô canh dáng thấp, men trắng ngà mộc mạc.',
        imageUrls: [
          wiki('4/46/Light_green_ceramic_bowl_1.jpg/960px-Light_green_ceramic_bowl_1.jpg'),
          wiki('7/79/Light_green_ceramic_bowl_3.jpg/960px-Light_green_ceramic_bowl_3.jpg')
        ]
      },
      {
        name: 'Đĩa chấm hình lá sen (bộ 4)',
        price: 140000,
        stock: 25,
        material: 'Gốm men ngọc',
        dimensions: 'Dài 10cm',
        description: 'Bộ 4 đĩa chấm nặn tay hình lá sen, mỗi chiếc một dáng.',
        imageUrls: [
          wiki('d/d2/Plate-MAHG_A_1998-0166-IMG_1957-white.jpg/960px-Plate-MAHG_A_1998-0166-IMG_1957-white.jpg'),
          wiki('2/25/Plate-MAHG_A_1998-0166-IMG_1957-gradient.jpg/960px-Plate-MAHG_A_1998-0166-IMG_1957-gradient.jpg')
        ]
      }
    ]
  },
  {
    name: 'Ấm chén',
    description: 'Bộ ấm trà, chén quân, khay trà cho những buổi trà chiều',
    imageUrl: wiki(
      'b/b8/Chinese_Export_porcelain%2C_late_18th-early_19th_century_-_Cups_and_Saucers_from_Oliver_Wolcott%2C_Jr._Tea_Service_-_2013.98_-_Cleveland_Museum_of_Art.jpg/960px-Chinese_Export_porcelain%2C_late_18th-early_19th_century_-_Cups_and_Saucers_from_Oliver_Wolcott%2C_Jr._Tea_Service_-_2013.98_-_Cleveland_Museum_of_Art.jpg'
    ),
    products: [
      {
        name: 'Bộ ấm chén men lam vẽ trúc',
        price: 850000,
        stock: 10,
        material: 'Gốm men lam',
        dimensions: 'Ấm 450ml, 6 chén',
        description: 'Gồm 1 ấm, 6 chén và 1 khay. Hoạ tiết trúc vẽ tay bằng men lam.',
        imageUrls: [
          wiki(
            'b/b8/Chinese_Export_porcelain%2C_late_18th-early_19th_century_-_Cups_and_Saucers_from_Oliver_Wolcott%2C_Jr._Tea_Service_-_2013.98_-_Cleveland_Museum_of_Art.jpg/960px-Chinese_Export_porcelain%2C_late_18th-early_19th_century_-_Cups_and_Saucers_from_Oliver_Wolcott%2C_Jr._Tea_Service_-_2013.98_-_Cleveland_Museum_of_Art.jpg'
          ),
          wiki(
            '6/6f/Chinese_Export_porcelain%2C_late_18th-early_19th_century_-_Cups_and_Saucers_from_Oliver_Wolcott%2C_Jr._Tea_Service_-_2013.98_-_Cleveland_Museum_of_Art.tif/lossy-page1-960px-Chinese_Export_porcelain%2C_late_18th-early_19th_century_-_Cups_and_Saucers_from_Oliver_Wolcott%2C_Jr._Tea_Service_-_2013.98_-_Cleveland_Museum_of_Art.tif.jpg'
          )
        ]
      },
      {
        name: 'Ấm trà men hoả biến',
        price: 620000,
        stock: 5,
        material: 'Gốm men hoả biến',
        dimensions: 'Dung tích 300ml',
        description: 'Men hoả biến đổi màu theo nhiệt lò, không có hai chiếc giống nhau.',
        imageUrls: [
          wiki(
            'e/e2/Wedgwood_Factory_%28British%29_-_Teapot_-_1951.309_-_Cleveland_Museum_of_Art.jpg/960px-Wedgwood_Factory_%28British%29_-_Teapot_-_1951.309_-_Cleveland_Museum_of_Art.jpg'
          ),
          wiki(
            '9/9f/Staffordshire_Factory_%28British%29_-_Teapot_-_1946.278.a_-_Cleveland_Museum_of_Art.jpg/960px-Staffordshire_Factory_%28British%29_-_Teapot_-_1946.278.a_-_Cleveland_Museum_of_Art.jpg'
          )
        ]
      },
      {
        name: 'Chén quân men rạn (bộ 6)',
        price: 240000,
        stock: 22,
        material: 'Gốm men rạn',
        dimensions: 'Dung tích 50ml',
        description: 'Bộ 6 chén uống trà nhỏ, men rạn chân chim.',
        imageUrls: [
          wiki(
            'd/da/Porcelain_cup_set_-_Santarcangelo_di_Romagna.jpg/960px-Porcelain_cup_set_-_Santarcangelo_di_Romagna.jpg'
          ),
          wiki(
            '1/17/Korea%2C_Goryeo_period_-_Crackle-glazed_Bowl_-_1921.626_-_Cleveland_Museum_of_Art.jpg/960px-Korea%2C_Goryeo_period_-_Crackle-glazed_Bowl_-_1921.626_-_Cleveland_Museum_of_Art.jpg'
          )
        ]
      }
    ]
  },
  {
    name: 'Cốc ly',
    description: 'Cốc cà phê, ly trà sữa, cốc quà tặng làm thủ công',
    imageUrl: wiki('e/e7/Beautiful_cup_of_tea_with_flowers_10.jpg/960px-Beautiful_cup_of_tea_with_flowers_10.jpg'),
    products: [
      {
        name: 'Cốc cà phê men xanh rêu',
        price: 120000,
        stock: 40,
        material: 'Gốm men rêu',
        dimensions: 'Dung tích 300ml',
        description: 'Cốc có quai, thành dày giữ nhiệt tốt.',
        imageUrls: ['https://upload.wikimedia.org/wikipedia/commons/e/e1/Ceramic_mug_antisky_ceramic.jpg']
      },
      {
        name: 'Cốc vẽ tay hoa cúc',
        price: 150000,
        stock: 3,
        material: 'Gốm men trắng',
        dimensions: 'Dung tích 350ml',
        description: 'Hoạ tiết hoa cúc vẽ tay, hợp làm quà tặng.',
        imageUrls: [
          wiki('e/e7/Beautiful_cup_of_tea_with_flowers_10.jpg/960px-Beautiful_cup_of_tea_with_flowers_10.jpg'),
          wiki('5/50/Beautiful_cup_of_tea_with_flowers_04.jpg/960px-Beautiful_cup_of_tea_with_flowers_04.jpg'),
          wiki('6/69/Beautiful_cup_of_tea_with_flowers_02.jpg/960px-Beautiful_cup_of_tea_with_flowers_02.jpg')
        ]
      },
      {
        name: 'Bộ đôi cốc men hai màu',
        price: 260000,
        stock: 15,
        material: 'Gốm men nâu – trắng',
        dimensions: 'Dung tích 280ml mỗi cốc',
        description: 'Một cốc men nâu, một cốc men trắng, đóng hộp quà.',
        imageUrls: [
          'https://upload.wikimedia.org/wikipedia/commons/8/82/Ceramic_mug_Antiksy_ceramic_mug.jpg',
          wiki(
            'e/e5/Unknown_artist_-_Mug_-_1961.183_-_Cleveland_Museum_of_Art.jpg/960px-Unknown_artist_-_Mug_-_1961.183_-_Cleveland_Museum_of_Art.jpg'
          )
        ]
      }
    ]
  },
  {
    name: 'Đồ trang trí',
    description: 'Tượng, chậu cây, đèn và đồ decor từ gốm',
    imageUrl: wiki(
      '0/00/Qilin_statues%2C_Bat_Trang_kiln%2C_Hanoi%2C_Nguyen_dynasty%2C_crackle_glaze_ceramics_-_National_Museum_of_Vietnamese_History_-_Hanoi%2C_Vietnam_-_DSC05411.JPG/960px-Qilin_statues%2C_Bat_Trang_kiln%2C_Hanoi%2C_Nguyen_dynasty%2C_crackle_glaze_ceramics_-_National_Museum_of_Vietnamese_History_-_Hanoi%2C_Vietnam_-_DSC05411.JPG'
    ),
    products: [
      {
        name: 'Chậu cây men xanh lam có đĩa',
        price: 180000,
        stock: 20,
        material: 'Gốm men lam',
        dimensions: 'Đường kính 14cm, cao 13cm',
        description: 'Chậu có lỗ thoát nước và đĩa lót, hợp trồng sen đá, xương rồng.',
        imageUrls: [
          wiki('e/e3/Narrowleaf_Zinnia_in_a_ceramic_pot.jpg/960px-Narrowleaf_Zinnia_in_a_ceramic_pot.jpg'),
          wiki('d/d7/Flaming_Katy_in_a_Ceramic_Pot_2.jpg/960px-Flaming_Katy_in_a_Ceramic_Pot_2.jpg')
        ]
      },
      {
        name: 'Tượng chú tiểu ngồi thiền',
        price: 290000,
        stock: 7,
        material: 'Gốm mộc',
        dimensions: 'Cao 15cm',
        description: 'Tượng nặn tay, để bàn làm việc hoặc tiểu cảnh.',
        imageUrls: [
          wiki(
            '3/3e/20260515_White_Pottery_Figurines_of_Buddhist_Monks.jpg/960px-20260515_White_Pottery_Figurines_of_Buddhist_Monks.jpg'
          )
        ]
      },
      {
        name: 'Đèn ngủ gốm khắc hoa văn',
        price: 750000,
        stock: 4,
        material: 'Gốm mộc',
        dimensions: 'Cao 25cm',
        description: 'Thân đèn khắc thủng hoa văn trống đồng, ánh sáng hắt ra thành hoạ tiết trên tường.',
        imageUrls: [wiki('8/81/Ceramic_lamp_-_Mexico.jpg/960px-Ceramic_lamp_-_Mexico.jpg')]
      },
      {
        name: 'Đĩa treo tường vẽ phong cảnh',
        price: 980000,
        stock: 0,
        material: 'Gốm men lam',
        dimensions: 'Đường kính 40cm',
        description: 'Đĩa trang trí vẽ cảnh làng gốm ven sông Hồng, kèm móc treo.',
        imageUrls: [
          wiki('0/00/Paris_-_Mus%C3%A9e_Guimet_8286.jpg/960px-Paris_-_Mus%C3%A9e_Guimet_8286.jpg'),
          wiki('9/9d/Schotel_met_bloemranken%2C_AK-RAK-1971-5.jpg/960px-Schotel_met_bloemranken%2C_AK-RAK-1971-5.jpg')
        ]
      }
    ]
  }
]

const HOUR_MS = 60 * 60 * 1000
const STUDIO = 'Xưởng Gốm Sứ Xanh, 12 Bát Tràng, Gia Lâm, Hà Nội'

// Giờ Việt Nam (UTC+7) của ngày cách hôm nay `days` ngày — lịch mẫu luôn nằm trong tương lai mỗi lần seed
const vnTime = (days: number, hour: number, minute = 0) => {
  const vnNow = new Date(Date.now() + 7 * HOUR_MS)
  return new Date(Date.UTC(vnNow.getUTCFullYear(), vnNow.getUTCMonth(), vnNow.getUTCDate() + days, hour - 7, minute))
}

const SAMPLE_WORKSHOPS: SampleWorkshop[] = [
  {
    name: 'Lớp vuốt gốm trên bàn xoay cơ bản',
    description:
      'Làm quen với đất sét, học cách định tâm và vuốt một chiếc cốc hoặc bát nhỏ trên bàn xoay. Sản phẩm được tráng men, nung và gửi về sau 2 tuần.',
    instructor: 'Nghệ nhân Lê Văn Thành',
    location: STUDIO,
    startsAt: vnTime(3, 9),
    endsAt: vnTime(3, 11, 30),
    registrationDeadline: vnTime(2, 20),
    price: 350000,
    capacity: 12,
    imageUrls: [
      wiki('3/3c/365-_pottery_class.jpg/960px-365-_pottery_class.jpg'),
      wiki(
        '9/9d/Pottery_at_the_Chokhi_Dhani_Resort_Panchkula_24.jpg/960px-Pottery_at_the_Chokhi_Dhani_Resort_Panchkula_24.jpg'
      )
    ]
  },
  {
    name: 'Lớp nặn gốm bằng tay cho gia đình',
    description: 'Bố mẹ và các bé cùng nặn đĩa, chén, con giống bằng tay — không cần bàn xoay. Phù hợp trẻ từ 5 tuổi.',
    instructor: 'Nghệ nhân Nguyễn Thị Hoa',
    location: STUDIO,
    startsAt: vnTime(6, 14),
    endsAt: vnTime(6, 16),
    registrationDeadline: null,
    price: 250000,
    capacity: 16,
    imageUrls: [
      wiki('6/67/Potter_at_work%2C_Jaura%2C_India.jpg/960px-Potter_at_work%2C_Jaura%2C_India.jpg'),
      wiki('2/26/Pottery_Class_%287441668838%29.jpg/960px-Pottery_Class_%287441668838%29.jpg')
    ]
  },
  {
    name: 'Lớp vẽ men lam trên gốm mộc',
    description: 'Vẽ hoạ tiết hoa sen, dây lá bằng men lam lên bình và đĩa gốm mộc có sẵn, sau đó nung ở 1.300°C.',
    instructor: 'Hoạ sĩ Trần Minh Đức',
    location: STUDIO,
    startsAt: vnTime(10, 9),
    endsAt: vnTime(10, 11),
    registrationDeadline: vnTime(8, 20),
    price: 300000,
    capacity: 10,
    imageUrls: [
      wiki(
        'a/af/Vase%2C_Bat_Trang_ceramic_with_blue_glaze_-_Nguyen_dynasty%2C_19th_century_AD_-_Vietnam_National_Museum_of_Fine_Arts_-_Hanoi%2C_Vietnam_-_DSC05325.JPG/960px-Vase%2C_Bat_Trang_ceramic_with_blue_glaze_-_Nguyen_dynasty%2C_19th_century_AD_-_Vietnam_National_Museum_of_Fine_Arts_-_Hanoi%2C_Vietnam_-_DSC05325.JPG'
      ),
      wiki('1/10/Bat-Trang-Ceramic-Village8.jpg/960px-Bat-Trang-Ceramic-Village8.jpg')
    ]
  },
  {
    name: 'Lớp vuốt gốm nâng cao: bình cổ cao',
    description: 'Dành cho người đã vuốt được cốc, bát. Học kéo thành cao, thắt cổ và tạo miệng bình.',
    instructor: 'Nghệ nhân Lê Văn Thành',
    location: STUDIO,
    startsAt: vnTime(14, 13, 30),
    endsAt: vnTime(14, 17, 30),
    registrationDeadline: vnTime(12, 20),
    price: 650000,
    capacity: 6,
    imageUrls: [
      wiki(
        '5/5b/Pottery_at_the_Chokhi_Dhani_Resort_Panchkula_31.jpg/960px-Pottery_at_the_Chokhi_Dhani_Resort_Panchkula_31.jpg'
      )
    ]
  },
  {
    name: 'Trải nghiệm làng gốm Bát Tràng nửa ngày',
    description: 'Dạo chợ gốm, thăm lò nung cổ và tự tay làm một sản phẩm nhỏ. Đã gồm nước uống và hướng dẫn viên.',
    instructor: null,
    location: 'Chợ gốm Bát Tràng, Gia Lâm, Hà Nội',
    startsAt: vnTime(21, 8),
    endsAt: vnTime(21, 12),
    registrationDeadline: null,
    price: 150000,
    capacity: 30,
    imageUrls: [
      wiki('a/ac/Bat-Trang-Ceramic-Village1.jpg/960px-Bat-Trang-Ceramic-Village1.jpg'),
      wiki('b/ba/Bat-Trang-Ceramic-Village3.jpg/960px-Bat-Trang-Ceramic-Village3.jpg'),
      wiki('8/8b/Bat-Trang-Ceramic-Village7.jpg/960px-Bat-Trang-Ceramic-Village7.jpg')
    ]
  }
]

// Thêm danh mục, sản phẩm và lớp workshop mẫu. Chạy lại nhiều lần cũng được: mục nào đã có (theo slug) thì giữ nguyên,
// chỉ điền ảnh mẫu khi mục đó chưa có ảnh (ảnh admin đã sửa không bị ghi đè)
const seedSample = async () => {
  const dataSource = await AppDataSource.connect()
  const categoryRepo = dataSource.getRepository(Category)
  const productRepo = dataSource.getRepository(Product)
  const workshopRepo = dataSource.getRepository(Workshop)

  const stats = { categories: 0, products: 0, workshops: 0, images: 0 }

  for (const { products, ...categoryData } of SAMPLE_CATALOG) {
    const categorySlug = slugify(categoryData.name)
    let category = await categoryRepo.findOne({ where: { slug: categorySlug } })
    if (!category) {
      category = await categoryRepo.save(categoryRepo.create({ ...categoryData, slug: categorySlug }))
      stats.categories++
    } else if (!category.imageUrl) {
      await categoryRepo.update(category.id, { imageUrl: categoryData.imageUrl })
      stats.images++
    }

    for (const productData of products) {
      const slug = slugify(productData.name)
      const existing = await productRepo.findOne({ where: { slug } })
      if (!existing) {
        await productRepo.save(productRepo.create({ ...productData, slug, categoryId: category.id }))
        stats.products++
      } else if (existing.imageUrls.length === 0) {
        await productRepo.update(existing.id, { imageUrls: productData.imageUrls })
        stats.images++
      }
    }
  }

  for (const workshopData of SAMPLE_WORKSHOPS) {
    const slug = slugify(workshopData.name)
    if (await workshopRepo.exists({ where: { slug } })) continue

    await workshopRepo.save(workshopRepo.create({ ...workshopData, slug }))
    stats.workshops++
  }

  logger.info(
    `Sample data: ${stats.categories} new categories, ${stats.products} new products, ` +
      `${stats.workshops} new workshops, ${stats.images} items got images`
  )
  await dataSource.destroy()
}

seedSample().catch((err) => {
  logger.fatal(err, 'Failed to seed sample data')
  process.exit(1)
})
