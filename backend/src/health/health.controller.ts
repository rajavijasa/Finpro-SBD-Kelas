import { Controller, Get } from '@nestjs/common';
import { Neo4jService } from '../neo4j/neo4j.service';

@Controller('health')
export class HealthController {
  constructor(private readonly neo4j: Neo4jService) {}

  @Get('neo4j')
  async neo4jHealth() {
    await this.neo4j.verifyConnectivity();

    const session = this.neo4j.getSession();
    try {
      const result = await session.run('RETURN 1 AS ok');
      return { ok: result.records[0]?.get('ok')?.toNumber?.() ?? 1 };
    } finally {
      await session.close();
    }
  }
}
