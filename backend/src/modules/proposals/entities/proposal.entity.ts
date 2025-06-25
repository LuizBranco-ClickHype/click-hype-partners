import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, BeforeInsert } from 'typeorm';
import { Partner } from '../../partners/entities/partner.entity';
import { ProposalItem } from './proposal-item.entity';
import { v4 as uuidv4 } from 'uuid';

export enum ProposalStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

@Entity('proposals')
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  clientName: string;

  @Column({ nullable: true })
  clientEmail: string;

  @Column('text')
  scope: string;

  @Column('decimal', { precision: 10, scale: 2 })
  totalValue: number;

  @Column({
    type: 'enum',
    enum: ProposalStatus,
    default: ProposalStatus.DRAFT
  })
  status: ProposalStatus;

  @Column('date')
  validUntil: Date;

  @Column({ unique: true })
  publicLink: string;

  @Column()
  partnerId: string;

  @ManyToOne(() => Partner, (partner) => partner.id)
  partner: Partner;

  @OneToMany(() => ProposalItem, (item) => item.proposal, { cascade: true })
  items: ProposalItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generatePublicLink() {
    if (!this.publicLink) {
      this.publicLink = uuidv4().replace(/-/g, '').substring(0, 16);
    }
  }
} 