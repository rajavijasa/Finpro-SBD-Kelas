import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Driver, Session } from 'neo4j-driver';
import { NEO4J_DRIVER } from './neo4j.constants';

@Injectable()
export class Neo4jService {
  constructor(
    @Inject(NEO4J_DRIVER) private readonly driver: Driver,
    private readonly config: ConfigService,
  ) {}

  getSession(): Session {
    const database = this.config.get<string>('NEO4J_DATABASE') ?? undefined;
    return this.driver.session({ database });
  }

  async verifyConnectivity(): Promise<void> {
    await this.driver.verifyConnectivity();
  }

  async close(): Promise<void> {
    await this.driver.close();
  }
}
