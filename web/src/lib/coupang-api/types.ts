// 쿠팡 Wing API 타입 정의

export interface CoupangCredentials {
  accessKey: string;
  secretKey: string;
  vendorId: string;
}

// 상품 관련
export interface CoupangProduct {
  sellerProductId?: string; // 등록 시에는 없음, 조회 시에만 존재
  sellerProductName: string;
  displayCategoryCode: number;
  categoryId?: number | string;
  productGroup?: string;
  brand?: string;
  generalProductName?: string;
  manufacture?: string | { manufacturerCode?: string; manufacturingDate?: string; releaseDate?: string };
  deliveryMethod?: 'DIRECT' | 'VENDOR_FULFILLMENT';
  deliveryCompanyCode?: string;
  deliveryChargeType: 'FREE' | 'NOT_FREE' | 'CONDITIONAL_FREE' | 'CHARGE_RECEIVED' | 'PAID';
  deliveryCharge?: number;
  freeShipOverAmount?: number;
  deliveryChargeOnReturn?: number;
  remoteAreaDeliverable?: string;
  unionDeliveryType?: string;
  returnCenterCode?: string;
  returnChargeName?: string;
  companyContactNumber?: string;
  returnZipCode?: string;
  returnAddress?: string;
  returnAddressDetail?: string;
  returnCharge?: number;
  returnChargeVendor?: string;
  afterServiceInformation?: string;
  afterServiceContactNumber?: string;
  outboundShippingPlaceCode?: string;
  vendorId?: string;
  vendorUserId?: string;
  requested?: boolean;
  items: CoupangProductItem[];
  requiredDocuments?: RequiredDocument[];
  extraInfos?: unknown[];
  extraInfoMessage?: string;
  requestedIpdDate?: string;
}

export interface CoupangProductItem {
  sellerProductItemId?: string; // 등록 시에는 없음
  sellerProductItemName?: string;
  itemName?: string;
  originalPrice: number;
  salePrice: number;
  maximumBuyCount?: number;
  maximumBuyForPerson?: number;
  maximumBuyForPersonPeriod?: number;
  outboundShippingTimeDay?: number;
  unitCount?: number;
  adultOnly?: 'Y' | 'N' | 'EVERYONE';
  taxType?: 'TAX' | 'FREE';
  parallelImported?: 'Y' | 'N' | 'NOT_PARALLEL_IMPORTED';
  overseasPurchased?: 'Y' | 'N' | 'NOT_OVERSEAS_PURCHASED';
  pccNeeded?: boolean;
  bestPriceGuaranteed3P?: boolean;
  externalVendorSku?: string;
  barcode?: string;
  emptyBarcode?: boolean;
  emptyBarcodeReason?: string;
  modelNo?: string;
  images?: ProductImage[];
  attributes?: ProductAttribute[];
  contents?: ProductContent[];
  certifications?: Certification[];
  extraInfos?: unknown[];
  notices?: Notice[];
  offerCondition?: 'NEW' | 'REFURBISHED';
  offerDescription?: string;
  searchTags?: string[];
}

export interface ProductImage {
  imageOrder: number;
  imageType: 'REPRESENTATIVE' | 'REPRESENTATION' | 'DETAIL';
  cdnPath: string;
  vendorPath: string;
}

export interface ProductAttribute {
  attributeTypeName: string;
  attributeValueName: string;
}

export interface ProductContent {
  contentsType: 'IMAGE' | 'IMAGE_NO_SPACE' | 'TEXT';
  contentDetails: ContentDetail[];
}

export interface ContentDetail {
  content: string;
  detailType: 'TEXT' | 'IMAGE';
}

export interface RequiredDocument {
  templateName: string;
  vendorDocumentPath: string;
}

export interface Certification {
  certificationType: string;
  certificationCode: string;
}

export interface Notice {
  noticeCategoryName: string;
  noticeCategoryDetailName: string;
  content: string;
}

// 주문 관련
export interface CoupangOrder {
  orderId: number;
  shipmentBoxId: number;
  orderedAt: string;
  orderer: Orderer;
  orderItems: OrderItem[];
  receiver: Receiver;
  overseaShippingInfoDto?: OverseaShippingInfo;
}

export interface Orderer {
  name: string;
  email?: string;
  ordererNumber: string;
  safeNumber?: string;
}

export interface OrderItem {
  vendorItemPackageId: number;
  vendorItemPackageName: string;
  vendorItemId: number;
  vendorItemName: string;
  shippingCount: number;
  salesPrice: number;
  orderPrice: number;
  discountPrice: number;
  instantCouponDiscount: number;
  downloadableCouponDiscount: number;
  coupangDiscount: number;
  externalVendorSkuCode?: string;
  etcInfoHeader?: string;
  etcInfoValue?: string;
  sellerProductId: number;
  sellerProductName: string;
  sellerProductItemId: number;
  firstSellerProductItemId?: number;
  cancelCount?: number;
  holdCountForCancel?: number;
  estimatedShippingDate?: string;
  plannedShippingDate?: string;
  invoiceNumberUploadDate?: string;
  paidAt?: string;
  confirmDate?: string;
  deliveredDate?: string;
}

export interface Receiver {
  name: string;
  safeNumber?: string;
  receiverNumber?: string;
  addr1: string;
  addr2: string;
  postCode: string;
  shippingMessage?: string;
}

export interface OverseaShippingInfo {
  personalCustomsClearanceCode: string;
  ordererSsn?: string;
  ordererPhoneNumber: string;
}

// API 응답 타입
export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

export interface OrderListResponse {
  data: CoupangOrder[];
  nextToken?: string;
}

export interface ProductRegistrationResponse {
  code: number;
  message: string;
  data: {
    sellerProductId: number;
  };
}

// 배송 관련
export interface ShipmentInput {
  shipmentBoxId: number;
  orderId: number;
  vendorItemId: number;
  deliveryCompanyCode: string;
  invoiceNumber: string;
  splitShipping?: boolean;
  preSplitShipped?: boolean;
  estimatedShippingDate?: string;
}

export interface ShipmentResponse {
  code: number;
  message: string;
  data: {
    shipmentBoxId: number;
    resultCode: string;
    resultMessage: string;
  };
}
