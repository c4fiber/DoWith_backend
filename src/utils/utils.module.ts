import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MulterConfig } from './fileUpload/MulterConfigService';

@Module({
  imports: [
    MulterModule.registerAsync({
      useClass: MulterConfig
    })
  ],
  exports: [ MulterModule ]
})
export class UtilsModule {}
