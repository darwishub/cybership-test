import { Request, Response } from "express"
import ResponseFormatter from "@/utils/responseFormatter"
import { RateService } from "@/application/services/rateService"
import { handleControllerError } from "@/utils/errorHandlerUtil"

export class RateController {

  constructor(private service: RateService) {}

  getRates = async (req: Request, res: Response) => {
    try {
      const data = await this.service.execute(req.body)

      return ResponseFormatter.success(
        res,
        "Rates fetched successfully",
        data
      )
    } catch (error) {
      return handleControllerError(error, res)
    }
  }
}
