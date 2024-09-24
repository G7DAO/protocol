   // logger.ts
   import { createLogger, format, transports } from 'winston';

   const customFormat = format.printf(({ timestamp, level, message }) => {
     return `${timestamp} ${level} ${message}`;
   });

   const logger = createLogger({
     level: 'info',
     format: format.combine(
       format.timestamp(),
       customFormat
     ),
     transports: [
       new transports.Console(),
       new transports.File({ filename: 'error.log', level: 'error' }),
       new transports.File({ filename: 'combined.log' })
     ]
   });

   export default logger;