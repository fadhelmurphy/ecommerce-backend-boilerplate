import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from "typeorm"
import { User } from "../../users/entities/user.entity"
import { OrderItem } from "./order-item.entity"
import { OrderStatus } from "../enums/order-status.enum"
import { PaymentStatus } from "../enums/payment-status.enum"

@Entity()
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ type: "enum", enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus

  @Column({ type: "enum", enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus

  @Column("decimal", { precision: 10, scale: 2 })
  total: number

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  tax: number

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  shipping: number

  @Column("decimal", { precision: 10, scale: 2 })
  subtotal: number

  @Column({ nullable: true })
  trackingNumber: string

  @Column({ nullable: true })
  paymentIntentId: string

  @Column("simple-json", { nullable: true })
  shippingAddress: {
    firstName: string
    lastName: string
    address1: string
    address2?: string
    city: string
    state: string
    postalCode: string
    country: string
    phone: string
  }

  @Column("simple-json", { nullable: true })
  billingAddress: {
    firstName: string
    lastName: string
    address1: string
    address2?: string
    city: string
    state: string
    postalCode: string
    country: string
    phone: string
  }

  @ManyToOne(
    () => User,
    (user) => user.orders,
  )
  user: User

  @OneToMany(
    () => OrderItem,
    (orderItem) => orderItem.order,
    { cascade: true },
  )
  items: OrderItem[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
