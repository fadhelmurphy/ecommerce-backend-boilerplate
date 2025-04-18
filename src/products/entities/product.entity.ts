import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from "typeorm"
import { Category } from "./category.entity"
import { OrderItem } from "../../orders/entities/order-item.entity"
import { CartItem } from "../../cart/entities/cart-item.entity"

@Entity()
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  name: string

  @Column("text")
  description: string

  @Column("decimal", { precision: 10, scale: 2 })
  price: number

  @Column("int")
  stock: number

  @Column({ default: true })
  isActive: boolean

  @Column("simple-array", { nullable: true })
  images: string[]

  @Column("simple-json", { nullable: true })
  attributes: Record<string, any>

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  weight: number

  @Column({ nullable: true })
  sku: string

  @ManyToOne(
    () => Category,
    (category) => category.products,
  )
  category: Category

  @OneToMany(
    () => OrderItem,
    (orderItem) => orderItem.product,
  )
  orderItems: OrderItem[]

  @OneToMany(
    () => CartItem,
    (cartItem) => cartItem.product,
  )
  cartItems: CartItem[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
