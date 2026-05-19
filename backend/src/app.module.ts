import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { Neo4jModule } from './neo4j/neo4j.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), Neo4jModule],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
