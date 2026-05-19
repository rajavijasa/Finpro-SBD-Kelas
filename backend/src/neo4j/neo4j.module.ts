import { Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import neo4j, { Driver } from 'neo4j-driver';
import { NEO4J_DRIVER } from './neo4j.constants';
import { Neo4jService } from './neo4j.service';

@Module({
  providers: [
    {
      provide: NEO4J_DRIVER,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Driver => {
        const uri = config.get<string>('NEO4J_URI');
        const username = config.get<string>('NEO4J_USERNAME');
        const password = config.get<string>('NEO4J_PASSWORD');

        if (!uri || !username || !password) {
          throw new Error(
            'Missing Neo4j env vars. Required: NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD',
          );
        }

        return neo4j.driver(uri, neo4j.auth.basic(username, password));
      },
    },
    Neo4jService,
  ],
  exports: [Neo4jService],
})
export class Neo4jModule implements OnApplicationShutdown {
  constructor(private readonly neo4jService: Neo4jService) {}

  async onApplicationShutdown() {
    await this.neo4jService.close();
  }
}
