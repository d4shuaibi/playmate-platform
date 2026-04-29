import { Controller, Get } from "@nestjs/common";
import { CustomerServiceService } from "./customer-service.service";

/**
 * 小程序公开接口（无需登录）：启用状态的客服资料与二维码。
 * GET /api/mini/customer-service/agents
 */
@Controller("mini/customer-service")
export class MiniCustomerServiceController {
  constructor(private readonly customerServiceService: CustomerServiceService) {}

  @Get("agents")
  listAgentsForMini() {
    return this.customerServiceService.listAgentsForMini();
  }
}
