export interface GhtkStatusDefinition {
  id: number
  text: string
  description: string
  isFinal: boolean
}

export const GHTK_STATUSES: Record<number, GhtkStatusDefinition> = {
  [-1]: {
    id: -1,
    text: 'Huy don hang',
    description: 'Don hang da bi huy',
    isFinal: true
  },
  [1]: {
    id: 1,
    text: 'Chua tiep nhan',
    description: 'Don hang moi tao tren he thong',
    isFinal: false
  },
  [2]: {
    id: 2,
    text: 'Da tiep nhan',
    description: 'Don hang da duoc he thong tiep nhan',
    isFinal: false
  },
  [12]: {
    id: 12,
    text: 'Dang lay hang',
    description: 'Da dieu phoi lay hang hoac shipper dang den lay',
    isFinal: false
  },
  [3]: {
    id: 3,
    text: 'Da lay hang / Da nhap kho',
    description: 'Shipper da lay hang va nhap vao kho trung chuyen',
    isFinal: false
  },
  [4]: {
    id: 4,
    text: 'Dang giao hang',
    description: 'Shipper dang di giao hang cho khach',
    isFinal: false
  },
  [5]: {
    id: 5,
    text: 'Da giao hang',
    description: 'Giao hang thanh cong cho nguoi nhan',
    isFinal: true
  },
  [6]: {
    id: 6,
    text: 'Da doi soat COD',
    description: 'Tien COD da duoc doi soat voi shop',
    isFinal: true
  },
  [7]: {
    id: 7,
    text: 'Khong lay duoc hang',
    description: 'Shipper khong lay duoc hang tu shop',
    isFinal: false
  },
  [8]: {
    id: 8,
    text: 'Hoan lay hang',
    description: 'Shop hen lay hang vao thoi diem khac',
    isFinal: false
  },
  [9]: {
    id: 9,
    text: 'Khong giao duoc hang',
    description: 'Giao hang khong thanh cong, can giao lai',
    isFinal: false
  },
  [10]: {
    id: 10,
    text: 'Delay giao hang',
    description: 'Khach hen giao lai vao thoi gian khac',
    isFinal: false
  },
  [11]: {
    id: 11,
    text: 'Da doi soat cong no tra hang',
    description: 'Doi soat phi tra hang',
    isFinal: true
  },
  [13]: {
    id: 13,
    text: 'Boi hoan',
    description: 'Don hang gap su co va duoc boi thuong',
    isFinal: true
  },
  [20]: {
    id: 20,
    text: 'Dang tra hang',
    description: 'Shipper dang van chuyen hang tra ve cho shop',
    isFinal: false
  },
  [21]: {
    id: 21,
    text: 'Da tra hang',
    description: 'Hang da duoc tra hoan tat ve cho shop',
    isFinal: true
  }
}

export function getStatusText(statusId: number): string {
  return GHTK_STATUSES[statusId]?.text || `Trang thai ${statusId}`
}
