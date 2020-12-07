import { NextFunction, Request, Response } from 'express';
import logging from '../config/logging';

const serverStatusCheck = (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({
        message: 'Server Status : Active'
    });
};

export default { serverStatusCheck };
