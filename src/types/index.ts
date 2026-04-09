export type Role = 'admin' | 'staff'

export interface StaffUser {
  id: string
  username: string
  role: Role
  is_active: boolean
  created_at: string
  created_by: string | null
}

export interface Ship {
  id: string
  ship_number: string
  owner_name: string
  created_at: string
  updated_at: string
}

export interface JWTPayload {
  sub: string       // user id
  username: string
  role: Role
  iat?: number
  exp?: number
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}
