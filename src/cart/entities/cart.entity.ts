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
import { CartItem } from "./cart-item.entity"

@Entity()
export class Cart {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ default: true })
  isActive: boolean

  @ManyToOne(
    () => User,
    (user) => user.carts,
  )
  user: User

  @OneToMany(
    () => CartItem,
    (cartItem) => cartItem.cart,
    { cascade: true },
  )
  items: CartItem[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
