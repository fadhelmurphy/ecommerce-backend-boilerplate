import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
} from "typeorm"
import { Exclude } from "class-transformer"
import * as bcrypt from "bcrypt"
import { Order } from "../../orders/entities/order.entity"
import { Cart } from "../../cart/entities/cart.entity"
import { Role } from "../enums/role.enum"

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  firstName: string

  @Column()
  lastName: string

  @Column({ unique: true })
  email: string

  @Column()
  @Exclude()
  password: string

  @Column({ type: "enum", enum: Role, default: Role.USER })
  role: Role

  @Column({ default: false })
  isEmailVerified: boolean

  @Column({ nullable: true })
  @Exclude()
  refreshToken: string

  @OneToMany(
    () => Order,
    (order) => order.user,
  )
  orders: Order[]

  @OneToMany(
    () => Cart,
    (cart) => cart.user,
  )
  carts: Cart[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10)
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password)
  }
}
