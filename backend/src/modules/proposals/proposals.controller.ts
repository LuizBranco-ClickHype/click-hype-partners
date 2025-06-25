import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Request, 
  Res,
  HttpStatus,
  BadRequestException 
} from '@nestjs/common';
import { Response } from 'express';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { PartnerGuard } from '../auth/guards/partner.guard';
import { ProposalStatus } from './entities/proposal.entity';
import { PdfService } from './pdf.service';

@Controller('proposals')
export class ProposalsController {
  constructor(
    private readonly proposalsService: ProposalsService,
    private readonly pdfService: PdfService,
  ) {}

  @Post()
  @UseGuards(PartnerGuard)
  create(@Body() createProposalDto: CreateProposalDto, @Request() req) {
    return this.proposalsService.create(createProposalDto, req.user.partnerId);
  }

  @Get()
  @UseGuards(PartnerGuard)
  findAll(@Request() req) {
    return this.proposalsService.findAll(req.user.partnerId);
  }

  @Get('public/:publicLink')
  findByPublicLink(@Param('publicLink') publicLink: string) {
    return this.proposalsService.findByPublicLink(publicLink);
  }

  @Get(':id')
  @UseGuards(PartnerGuard)
  findOne(@Param('id') id: string, @Request() req) {
    return this.proposalsService.findOne(id, req.user.partnerId);
  }

  @Get(':id/pdf')
  @UseGuards(PartnerGuard)
  async generatePdf(@Param('id') id: string, @Request() req, @Res() res: Response) {
    try {
      const proposal = await this.proposalsService.findOne(id, req.user.partnerId);
      const pdfBuffer = await this.pdfService.generateProposalPdf(proposal);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Proposta-${proposal.title.replace(/\s+/g, '-')}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      });
      
      res.send(pdfBuffer);
    } catch (error) {
      throw new BadRequestException('Erro ao gerar PDF da proposta');
    }
  }

  @Patch(':id')
  @UseGuards(PartnerGuard)
  update(@Param('id') id: string, @Body() updateProposalDto: UpdateProposalDto, @Request() req) {
    return this.proposalsService.update(id, updateProposalDto, req.user.partnerId);
  }

  @Patch('public/:publicLink/status')
  updateStatus(@Param('publicLink') publicLink: string, @Body() body: { status: ProposalStatus }) {
    return this.proposalsService.updateStatus(publicLink, body.status);
  }

  @Delete(':id')
  @UseGuards(PartnerGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.proposalsService.remove(id, req.user.partnerId);
  }
} 