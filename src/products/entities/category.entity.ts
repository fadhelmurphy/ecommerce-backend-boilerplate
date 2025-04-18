import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm"
import { Product } from "./product.entity"

@Entity()
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column()
  name: string

  @Column("text", { nullable: true })
  description: string

  @Column({ nullable: true })
  image: string

  @Column({ default: true })
  isActive: boolean

  @OneToMany(
    () => Product,
    (product) => product.category,
  )
  products: Product[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
