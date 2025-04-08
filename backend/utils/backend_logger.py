import logging
from logging.handlers import TimedRotatingFileHandler
import os

class BackendLogger:
    def __init__(self, logger_name='backend', level=None):
        
        env_level = os.getenv('LOG_LEVEL', 'INFO').upper()
        self.level = level or getattr(logging, env_level, logging.INFO)

        # Create logs directory if it doesn't exist
        self.log_dir = './logs/'
        if not os.path.exists(self.log_dir):
            os.makedirs(self.log_dir)
        
        # Create and configure logger
        self.logger = logging.getLogger(logger_name)
        self.logger.setLevel(self.level)
        
        # Create formatter
        formatter = logging.Formatter(
            '%(levelname)-8s | %(asctime)s | %(filename)s:%(lineno)d | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        # Timed rotating file handler
        file_handler = TimedRotatingFileHandler(
            filename=os.path.join(self.log_dir, f'{logger_name}.log'),
            when='midnight',
            interval=1,
            backupCount=7,
            encoding='utf-8'
        )
        file_handler.setFormatter(formatter)
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        
        # Clear existing handlers and add new ones
        if self.logger.handlers:
            self.logger.handlers.clear()
        self.logger.addHandler(file_handler)
        self.logger.addHandler(console_handler)