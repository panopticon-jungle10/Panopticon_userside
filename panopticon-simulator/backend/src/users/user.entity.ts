import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from '../orders/order.entity';
import { Cart } from '../cart/cart.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ length: 150 })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => Cart, (cart) => cart.user)
  carts: Cart[];
}
