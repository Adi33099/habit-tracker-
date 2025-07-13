// focus.js - Pomodoro Focus Session Controller

class PomodoroTimer {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.currentSession = 1;
    this.maxSessions = 4;
    this.sessionType = 'focus'; // 'focus', 'shortBreak', 'longBreak'
    this.timeRemaining = 25 * 60; // 25 minutes in seconds
    this.totalTime = 25 * 60;
    this.interval = null;
    
    // Settings
    this.settings = {
      focusDuration: 25,
      shortBreak: 5,
      longBreak: 15,
      autoStartBreaks: false,
      soundEnabled: true,
      volume: 50,
      theme: 'lavender'
    };
    
    // Stats
    this.todayStats = {
      completedSessions: 0,
      totalFocusTime: 0,
      sessionHistory: []
    };
    
    this.motivationalQuotes = [
      { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
      { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
      { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
      { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
      { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
      { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
      { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
      { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
      { text: "Your limitation—it's only your imagination.", author: "Unknown" },
      { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" }
    ];
    
    this.initializeTimer();
    this.loadSettings();
    this.loadTodayStats();
    this.setupEventListeners();
    this.updateDisplay();
    this.showRandomQuote();
  }

  initializeTimer() {
    // Load saved timer state
    const savedState = localStorage.getItem('pomodoroState');
    if (savedState) {
      const state = JSON.parse(savedState);
      this.currentSession = state.currentSession || 1;
      this.sessionType = state.sessionType || 'focus';
      this.timeRemaining = state.timeRemaining || this.getDurationForSession();
      this.totalTime = state.totalTime || this.getDurationForSession();
      
      // If timer was running, continue from where it left off
      if (state.isRunning && state.lastUpdate) {
        const timePassed = Math.floor((Date.now() - state.lastUpdate) / 1000);
        this.timeRemaining = Math.max(0, this.timeRemaining - timePassed);
        
        if (this.timeRemaining > 0) {
          this.isRunning = true;
          this.startTimer();
        } else {
          this.completeSession();
        }
      }
    }
  }

  loadSettings() {
    const savedSettings = localStorage.getItem('pomodoroSettings');
    if (savedSettings) {
      this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
    }
    
    // Apply settings to UI
    document.getElementById('focusDuration').value = this.settings.focusDuration;
    document.getElementById('shortBreak').value = this.settings.shortBreak;
    document.getElementById('longBreak').value = this.settings.longBreak;
    document.getElementById('volumeSlider').value = this.settings.volume;
    
    // Apply theme
    document.body.className = `theme-${this.settings.theme}`;
    document.querySelectorAll('.theme-option').forEach(option => {
      option.classList.toggle('active', option.dataset.theme === this.settings.theme);
    });
    
    // Apply toggles
    document.getElementById('autoStartBreaks').classList.toggle('active', this.settings.autoStartBreaks);
    document.getElementById('soundToggle').classList.toggle('active', this.settings.soundEnabled);
  }

  loadTodayStats() {
    const today = new Date().toISOString().split('T')[0];
    const savedStats = localStorage.getItem(`pomodoroStats_${today}`);
    if (savedStats) {
      this.todayStats = JSON.parse(savedStats);
    }
    this.updateStatsDisplay();
  }

  saveSettings() {
    localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));
  }

  saveTodayStats() {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`pomodoroStats_${today}`, JSON.stringify(this.todayStats));
  }

  saveTimerState() {
    const state = {
      currentSession: this.currentSession,
      sessionType: this.sessionType,
      timeRemaining: this.timeRemaining,
      totalTime: this.totalTime,
      isRunning: this.isRunning,
      lastUpdate: Date.now()
    };
    localStorage.setItem('pomodoroState', JSON.stringify(state));
  }

  setupEventListeners() {
    // Timer controls
    document.getElementById('startBtn').addEventListener('click', () => this.startTimer());
    document.getElementById('pauseBtn').addEventListener('click', () => this.pauseTimer());
    document.getElementById('resetBtn').addEventListener('click', () => this.resetTimer());
    document.getElementById('stopBtn').addEventListener('click', () => this.stopTimer());
    
    // Settings
    document.getElementById('focusDuration').addEventListener('change', (e) => {
      this.settings.focusDuration = parseInt(e.target.value);
      this.saveSettings();
      if (this.sessionType === 'focus' && !this.isRunning) {
        this.resetTimer();
      }
    });
    
    document.getElementById('shortBreak').addEventListener('change', (e) => {
      this.settings.shortBreak = parseInt(e.target.value);
      this.saveSettings();
      if (this.sessionType === 'shortBreak' && !this.isRunning) {
        this.resetTimer();
      }
    });
    
    document.getElementById('longBreak').addEventListener('change', (e) => {
      this.settings.longBreak = parseInt(e.target.value);
      this.saveSettings();
      if (this.sessionType === 'longBreak' && !this.isRunning) {
        this.resetTimer();
      }
    });
    
    document.getElementById('volumeSlider').addEventListener('input', (e) => {
      this.settings.volume = parseInt(e.target.value);
      this.saveSettings();
    });
    
    // Toggles
    document.getElementById('autoStartBreaks').addEventListener('click', (e) => {
      this.settings.autoStartBreaks = !this.settings.autoStartBreaks;
      e.target.classList.toggle('active', this.settings.autoStartBreaks);
      this.saveSettings();
    });
    
    document.getElementById('soundToggle').addEventListener('click', (e) => {
      this.settings.soundEnabled = !this.settings.soundEnabled;
      e.target.classList.toggle('active', this.settings.soundEnabled);
      this.saveSettings();
    });
    
    // Theme selection
    document.querySelectorAll('.theme-option').forEach(option => {
      option.addEventListener('click', () => {
        this.settings.theme = option.dataset.theme;
        document.body.className = `theme-${this.settings.theme}`;
        document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        this.saveSettings();
      });
    });
    
    // Page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.saveTimerState();
      } else {
        this.initializeTimer();
        this.updateDisplay();
      }
    });
    
    // Save state periodically
    setInterval(() => {
      if (this.isRunning) {
        this.saveTimerState();
      }
    }, 5000);
  }

  getDurationForSession() {
    switch (this.sessionType) {
      case 'focus':
        return this.settings.focusDuration * 60;
      case 'shortBreak':
        return this.settings.shortBreak * 60;
      case 'longBreak':
        return this.settings.longBreak * 60;
      default:
        return this.settings.focusDuration * 60;
    }
  }

  startTimer() {
    if (this.isPaused) {
      this.isPaused = false;
    } else if (!this.isRunning) {
      this.isRunning = true;
      this.timeRemaining = this.getDurationForSession();
      this.totalTime = this.timeRemaining;
    }
    
    this.isRunning = true;
    
    // Update UI
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('pauseBtn').style.display = 'inline-flex';
    document.getElementById('stopBtn').style.display = 'inline-flex';
    
    // Start countdown
    this.interval = setInterval(() => {
      this.timeRemaining--;
      this.updateDisplay();
      
      if (this.timeRemaining <= 0) {
        this.completeSession();
      }
    }, 1000);
    
    this.saveTimerState();
  }

  pauseTimer() {
    this.isRunning = false;
    this.isPaused = true;
    clearInterval(this.interval);
    
    // Update UI
    document.getElementById('startBtn').style.display = 'inline-flex';
    document.getElementById('pauseBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'inline-flex';
    
    this.saveTimerState();
  }

  resetTimer() {
    this.isRunning = false;
    this.isPaused = false;
    clearInterval(this.interval);
    
    this.timeRemaining = this.getDurationForSession();
    this.totalTime = this.timeRemaining;
    
    // Update UI
    document.getElementById('startBtn').style.display = 'inline-flex';
    document.getElementById('pauseBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'none';
    
    this.updateDisplay();
    this.saveTimerState();
  }

  stopTimer() {
    this.isRunning = false;
    this.isPaused = false;
    clearInterval(this.interval);
    
    // Reset to focus session
    this.sessionType = 'focus';
    this.currentSession = 1;
    this.timeRemaining = this.getDurationForSession();
    this.totalTime = this.timeRemaining;
    
    // Update UI
    document.getElementById('startBtn').style.display = 'inline-flex';
    document.getElementById('pauseBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'none';
    
    this.updateDisplay();
    this.saveTimerState();
  }

  completeSession() {
    this.isRunning = false;
    clearInterval(this.interval);
    
    // Play notification sound
    this.playNotificationSound();
    
    // Show notification
    this.showNotification();
    
    // Update stats
    if (this.sessionType === 'focus') {
      this.todayStats.completedSessions++;
      this.todayStats.totalFocusTime += this.settings.focusDuration;
      
      // Award XP through extension
      this.awardXP(this.settings.focusDuration * 2);
    }
    
    // Add to session history
    this.todayStats.sessionHistory.unshift({
      type: this.sessionType,
      duration: this.sessionType === 'focus' ? this.settings.focusDuration : 
                this.sessionType === 'shortBreak' ? this.settings.shortBreak : this.settings.longBreak,
      completedAt: new Date().toLocaleTimeString(),
      timestamp: Date.now()
    });
    
    // Keep only last 10 sessions
    if (this.todayStats.sessionHistory.length > 10) {
      this.todayStats.sessionHistory = this.todayStats.sessionHistory.slice(0, 10);
    }
    
    this.saveTodayStats();
    this.updateStatsDisplay();
    
    // Move to next session
    this.moveToNextSession();
  }

  moveToNextSession() {
    if (this.sessionType === 'focus') {
      // After focus, go to break
      if (this.currentSession % 4 === 0) {
        this.sessionType = 'longBreak';
      } else {
        this.sessionType = 'shortBreak';
      }
    } else {
      // After break, go to next focus session
      this.sessionType = 'focus';
      if (this.sessionType === 'focus') {
        this.currentSession++;
        if (this.currentSession > this.maxSessions) {
          this.currentSession = 1;
        }
      }
    }
    
    this.timeRemaining = this.getDurationForSession();
    this.totalTime = this.timeRemaining;
    
    // Update UI
    document.getElementById('startBtn').style.display = 'inline-flex';
    document.getElementById('pauseBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'none';
    
    this.updateDisplay();
    
    // Auto-start breaks if enabled
    if (this.settings.autoStartBreaks && this.sessionType !== 'focus') {
      setTimeout(() => {
        this.startTimer();
      }, 3000);
    }
    
    this.saveTimerState();
  }

  updateDisplay() {
    // Update timer display
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('timerDisplay').textContent = timeString;
    
    // Update session type and counter
    const sessionTypeElement = document.getElementById('sessionType');
    const sessionCounterElement = document.getElementById('sessionCounter');
    const timerDisplayElement = document.getElementById('timerDisplay');
    
    switch (this.sessionType) {
      case 'focus':
        sessionTypeElement.innerHTML = '<i class="fas fa-brain"></i><span>Focus Session</span>';
        sessionCounterElement.textContent = `Session ${this.currentSession} of ${this.maxSessions}`;
        timerDisplayElement.className = 'timer-display focus-mode';
        document.getElementById('progressCircle').style.stroke = '#4ade80';
        break;
      case 'shortBreak':
        sessionTypeElement.innerHTML = '<i class="fas fa-coffee"></i><span>Short Break</span>';
        sessionCounterElement.textContent = 'Take a quick break';
        timerDisplayElement.className = 'timer-display break-mode';
        document.getElementById('progressCircle').style.stroke = '#fbbf24';
        break;
      case 'longBreak':
        sessionTypeElement.innerHTML = '<i class="fas fa-star"></i><span>Long Break</span>';
        sessionCounterElement.textContent = 'Well deserved rest!';
        timerDisplayElement.className = 'timer-display long-break-mode';
        document.getElementById('progressCircle').style.stroke = '#a78bfa';
        break;
    }
    
    // Update progress ring
    this.updateProgressRing();
    
    // Update page title
    document.title = `${timeString} - StudyFlow Focus`;
  }

  updateProgressRing() {
    const circle = document.getElementById('progressCircle');
    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    
    const progress = (this.totalTime - this.timeRemaining) / this.totalTime;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress * circumference);
    
    circle.style.strokeDasharray = strokeDasharray;
    circle.style.strokeDashoffset = strokeDashoffset;
  }

  updateStatsDisplay() {
    document.getElementById('completedSessions').textContent = this.todayStats.completedSessions;
    
    const hours = Math.floor(this.todayStats.totalFocusTime / 60);
    const minutes = this.todayStats.totalFocusTime % 60;
    document.getElementById('totalFocusTime').textContent = 
      hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    
    // Update session history
    const historyContainer = document.getElementById('sessionHistory');
    historyContainer.innerHTML = '';
    
    this.todayStats.sessionHistory.forEach(session => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      
      const typeIcon = session.type === 'focus' ? '🧠' : 
                      session.type === 'shortBreak' ? '☕' : '⭐';
      
      historyItem.innerHTML = `
        <div class="history-type">
          <span>${typeIcon}</span>
          <span>${session.type === 'focus' ? 'Focus' : 
                  session.type === 'shortBreak' ? 'Short Break' : 'Long Break'}</span>
        </div>
        <div class="history-duration">${session.duration}m</div>
      `;
      
      historyContainer.appendChild(historyItem);
    });
  }

  playNotificationSound() {
    if (!this.settings.soundEnabled) return;
    
    // Create audio context and generate notification sound
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.settings.volume / 100 * 0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio notification not available');
    }
  }

  showNotification() {
    const popup = document.getElementById('notificationPopup');
    const title = document.getElementById('notificationTitle');
    const message = document.getElementById('notificationMessage');
    
    if (this.sessionType === 'focus') {
      title.innerHTML = '<i class="fas fa-check-circle"></i>Focus Session Complete!';
      message.textContent = 'Great job! Time for a well-deserved break.';
    } else {
      title.innerHTML = '<i class="fas fa-coffee"></i>Break Time Over!';
      message.textContent = 'Ready to get back to focused work?';
    }
    
    popup.classList.add('show');
    
    setTimeout(() => {
      popup.classList.remove('show');
    }, 4000);
  }

  showRandomQuote() {
    const quote = this.motivationalQuotes[Math.floor(Math.random() * this.motivationalQuotes.length)];
    document.getElementById('quoteText').textContent = `"${quote.text}"`;
    document.getElementById('quoteAuthor').textContent = `— ${quote.author}`;
  }

  awardXP(amount) {
    // Send message to background script to award XP
    try {
      chrome.runtime.sendMessage({
        type: 'UPDATE_XP',
        amount: amount
      }, (response) => {
        if (response && response.status === 'XP updated') {
          console.log(`Awarded ${amount} XP. Total: ${response.newXP}`);
        }
      });
    } catch (error) {
      console.log('Could not award XP - extension context not available');
    }
  }
}

// Initialize the Pomodoro timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const timer = new PomodoroTimer();
  
  // Change quote every 5 minutes
  setInterval(() => {
    timer.showRandomQuote();
  }, 5 * 60 * 1000);
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  // Save current state
  const timer = window.timer;
  if (timer) {
    timer.saveTimerState();
  }
});