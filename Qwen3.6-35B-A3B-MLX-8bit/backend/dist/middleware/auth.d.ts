import { Request, Response, NextFunction } from 'express';
declare const JWT_SECRET: string;
declare const JWT_REFRESH_SECRET: string;
export interface AuthRequest extends Request {
    user?: {
        id: number;
        username: string;
    };
}
export declare function authenticate(req: Request, res: Response, next: NextFunction): void;
export { JWT_SECRET, JWT_REFRESH_SECRET };
