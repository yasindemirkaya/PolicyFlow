export interface CreateCustomerDto {
  firstName: string;
  lastName: string;
  nationalId: string;
  birthDate: string;
  email: string;
  phone?: string;
}