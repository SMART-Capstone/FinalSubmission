import { Shim } from "fabric-shim";
import { Context } from "fabric-contract-api";
export class AuthChecker {
  public static checkAuth(ctx: Context, userId: string): boolean {
    if (userId !== ctx.clientIdentity.getAttributeValue("hf.EnrollmentID")) {
      return false;
    }
    return true;
  }
}
