// Server Health Monitor & Auto-Restart Service
const http = require('http');
const { spawn, exec } = require('child_process');

let backendProcess = null;
let frontendProcess = null;
let mongoProcess = null;
let isMonitoring = false;

const COLORS = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',
  RESET: '\x1b[0m'
};

const log = (message, color = COLORS.WHITE) => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] ${message}${COLORS.RESET}`);
};

const checkHealth = (url) => {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.status === 'healthy');
        } catch {
          resolve(false);
        }
      });
    });
    
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
};

const killProcess = (processName) => {
  return new Promise((resolve) => {
    exec(`taskkill /F /IM ${processName}`, (error) => {
      // Don't log error if process wasn't running
      resolve();
    });
  });
};

const startMongoDB = () => {
  return new Promise((resolve) => {
    exec('net start MongoDB', (error) => {
      if (error) {
        log('MongoDB service not found, starting manually...', COLORS.YELLOW);
        mongoProcess = spawn('mongod', ['--dbpath=data'], {
          stdio: 'ignore',
          detached: true
        });
        setTimeout(resolve, 3000);
      } else {
        log('MongoDB service started', COLORS.GREEN);
        resolve();
      }
    });
  });
};

const startBackend = () => {
  return new Promise((resolve) => {
    log('Starting backend server...', COLORS.BLUE);
    backendProcess = spawn('node', ['server.js'], {
      cwd: 'server',
      stdio: 'pipe'
    });
    
    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('running on port')) {
        log('✅ Backend server started successfully', COLORS.GREEN);
        resolve();
      }
    });
    
    backendProcess.stderr.on('data', (data) => {
      log(`Backend Error: ${data.toString()}`, COLORS.RED);
    });
    
    backendProcess.on('close', (code) => {
      log(`❌ Backend process closed with code ${code}`, COLORS.RED);
      backendProcess = null;
    });
    
    // Timeout fallback
    setTimeout(resolve, 8000);
  });
};

const startFrontend = () => {
  return new Promise((resolve) => {
    log('Starting frontend server...', COLORS.CYAN);
    frontendProcess = spawn('npm', ['start'], {
      stdio: 'pipe',
      shell: true
    });
    
    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:') || output.includes('compiled')) {
        log('✅ Frontend server started successfully', COLORS.GREEN);
        resolve();
      }
    });
    
    frontendProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (!error.includes('warning') && !error.includes('Warning')) {
        log(`Frontend Error: ${error}`, COLORS.RED);
      }
    });
    
    frontendProcess.on('close', (code) => {
      log(`❌ Frontend process closed with code ${code}`, COLORS.RED);
      frontendProcess = null;
    });
    
    // Timeout fallback
    setTimeout(resolve, 15000);
  });
};

const monitorServices = async () => {
  if (!isMonitoring) return;
  
  // Check backend health
  const backendHealthy = await checkHealth('http://localhost:5001/api/health');
  
  if (!backendHealthy) {
    log('⚠️ Backend is unhealthy, restarting...', COLORS.YELLOW);
    
    // Kill existing processes
    await killProcess('node.exe');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Restart services
    await startMongoDB();
    await startBackend();
    
    log('🔄 Backend restart completed', COLORS.GREEN);
  }
  
  // Schedule next check
  setTimeout(monitorServices, 30000); // Check every 30 seconds
};

const startMonitoring = async () => {
  log('🚀 Starting SoleVibe Server Monitor...', COLORS.MAGENTA);
  
  // Clean up any existing processes
  await killProcess('node.exe');
  await killProcess('mongod.exe');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Start services in order
  log('1. Starting MongoDB...', COLORS.BLUE);
  await startMongoDB();
  
  log('2. Starting Backend API...', COLORS.BLUE);
  await startBackend();
  
  log('3. Starting Frontend...', COLORS.BLUE);
  await startFrontend();
  
  log('✅ All services started! Beginning health monitoring...', COLORS.GREEN);
  log('📝 Access URLs:', COLORS.WHITE);
  log('   👤 User Site:  http://localhost:3000', COLORS.CYAN);
  log('   👨‍💼 Admin Panel: http://localhost:3000/admin', COLORS.CYAN);
  log('   🔧 API Health:  http://localhost:5001/api/health', COLORS.CYAN);
  log('', COLORS.WHITE);
  log('⚠️ Keep this window open. Monitoring active...', COLORS.YELLOW);
  
  isMonitoring = true;
  monitorServices();
};

const stopMonitoring = () => {
  log('🔄 Stopping all services...', COLORS.YELLOW);
  isMonitoring = false;
  
  if (backendProcess) backendProcess.kill();
  if (frontendProcess) frontendProcess.kill();
  if (mongoProcess) mongoProcess.kill();
  
  setTimeout(() => {
    killProcess('node.exe');
    killProcess('mongod.exe');
    log('✅ All services stopped', COLORS.GREEN);
    process.exit(0);
  }, 2000);
};

// Handle Ctrl+C
process.on('SIGINT', stopMonitoring);

// Start monitoring
startMonitoring().catch((error) => {
  log(`❌ Failed to start monitoring: ${error.message}`, COLORS.RED);
  process.exit(1);
});