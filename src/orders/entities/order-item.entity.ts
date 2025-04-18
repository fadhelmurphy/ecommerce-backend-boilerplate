import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm"
import { Order } from "./order.entity"
import { Product } from "../../products/entities/product.entity"

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column("int")
  quantity: number

  @Column("decimal", { precision: 10, scale: 2 })
  price: number

  @Column("decimal", { precision: 10, scale: 2 })
  total: number

  @ManyToOne(
    () => Order,
    (order) => order.items,
  )
  order: Order

  @ManyToOne(
    () => Product,
    (product) => product.orderItems,
  )
  product: Product

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
