import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsRepository } from './transactions.repository';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [PrismaModule],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    {
      provide: 'ITransactionsRepository',
      useClass: TransactionsRepository,
    },
  ],
  exports: [TransactionsService, 'ITransactionsRepository'],
})
export class TransactionsModule {}
