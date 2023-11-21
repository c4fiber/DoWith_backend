import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MulterConfigService } from './fileUpload/MulterConfigService';

@Module({
  imports: [
    MulterModule.registerAsync({
      useClass: MulterConfigService
    })
  ],
  exports: [ MulterModule ]
})
export class UtilsModule {}
