import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Proposal } from './proposal.entity';

@Entity('proposal_items')
export class ProposalItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  value: number;

  @Column()
  proposalId: string;

  @ManyToOne(() => Proposal, (proposal) => proposal.items, { onDelete: 'CASCADE' })
  proposal: Proposal;
} 