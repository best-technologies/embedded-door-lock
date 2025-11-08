import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ResponseHelper } from '../helpers/response.helper';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string;
    let errors: any = undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object') {
      const responseObj = exceptionResponse as any;
      
      // Handle validation errors
      if (Array.isArray(responseObj.message)) {
        message = 'Validation failed';
        errors = responseObj.message;
      } else if (responseObj.message) {
        message = responseObj.message;
      } else {
        message = exception.message || 'An error occurred';
      }
    } else {
      message = exception.message || 'An error occurred';
    }

    // For validation errors, include them in the data field
    const errorResponse = errors 
      ? ResponseHelper.error(message, errors)
      : ResponseHelper.error(message);

    response.status(status).json(errorResponse);
  }
}

