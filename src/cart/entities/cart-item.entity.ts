import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm"
import { Cart } from "./cart.entity"
import { Product } from "../../products/entities/product.entity"

@Entity()
export class CartItem {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column("int")
  quantity: number

  @ManyToOne(
    () => Cart,
    (cart) => cart.items,
  )
  cart: Cart

  @ManyToOne(
    () => Product,
    (product) => product.cartItems,
  )
  product: Product

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
