// Timezone management
let timezones = [];
const STORAGE_KEY = 'selected_timezones';

// DOM Elements
const timezoneSelect = document.getElementById('timezoneSelect');
const addBtn = document.getElementById('addBtn');
const clocksContainer = document.getElementById('clocksContainer');
const emptyState = document.getElementById('emptyState');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadTimezones();
    if (timezones.length > 0) {
        renderClocks();
    }
    updateAllClocks();
    setInterval(updateAllClocks, 1000);
});

// Add timezone event listener
addBtn.addEventListener('click', addTimezone);
timezoneSelect.addEventListener('change', (e) => {
    if (e.target.value) {
        addTimezone();
    }
});

// Add a new timezone
function addTimezone() {
    const selectedTimezone = timezoneSelect.value;
    
    if (!selectedTimezone) {
        alert('Please select a timezone');
        return;
    }

    if (timezones.includes(selectedTimezone)) {
        alert('This timezone is already added');
        timezoneSelect.value = '';
        return;
    }

    timezones.push(selectedTimezone);
    saveTimezones();
    renderClocks();
    timezoneSelect.value = '';
}

// Remove a timezone
function removeTimezone(timezone) {
    timezones = timezones.filter(tz => tz !== timezone);
    saveTimezones();
    renderClocks();
}

// Save timezones to localStorage
function saveTimezones() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timezones));
}

// Load timezones from localStorage
function loadTimezones() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        timezones = JSON.parse(stored);
    }
}

// Render all clock cards
function renderClocks() {
    clocksContainer.innerHTML = '';

    if (timezones.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    timezones.forEach(timezone => {
        const card = createClockCard(timezone);
        clocksContainer.appendChild(card);
    });
}

// Create a single clock card
function createClockCard(timezone) {
    const card = document.createElement('div');
    card.className = 'clock-card';
    card.id = `clock-${timezone}`;

    const timezoneName = formatTimezoneName(timezone);
    const offset = getTimezoneOffset(timezone);

    card.innerHTML = `
        <div class="clock-header">
            <div>
                <div class="timezone-name">${timezoneName}</div>
                <div class="timezone-offset">${offset}</div>
            </div>
            <button class="remove-btn" onclick="removeTimezone('${timezone}')">×</button>
        </div>

        <div class="digital-clock">
            <div class="time-display" id="time-${timezone}">--:--:--</div>
            <div class="date-display" id="date-${timezone}">--/--/--</div>
            <div class="time-format-toggle">
                <button class="format-btn active" onclick="toggleFormat('${timezone}', '24')">24H</button>
                <button class="format-btn" onclick="toggleFormat('${timezone}', '12')">12H</button>
            </div>
        </div>

        <div class="clock-info">
            <div class="info-item">
                <div class="info-label">Day of Week</div>
                <div class="info-value" id="dayofweek-${timezone}">-</div>
            </div>
            <div class="info-item">
                <div class="info-label">Week #</div>
                <div class="info-value" id="weeknum-${timezone}">-</div>
            </div>
        </div>
    `;

    return card;
}

// Format timezone name
function formatTimezoneName(timezone) {
    return timezone
        .split('/')
        .join(' - ')
        .replace(/_/g, ' ');
}

// Get timezone offset from UTC
function getTimezoneOffset(timezone) {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'short'
    });
    
    const parts = formatter.formatToParts(new Date());
    const timezonePart = parts.find(p => p.type === 'timeZoneName');
    
    return timezonePart ? timezonePart.value : 'UTC';
}

// Update all clocks
function updateAllClocks() {
    timezones.forEach(timezone => {
        updateClock(timezone);
    });
}

// Update a single clock
function updateClock(timezone) {
    const now = new Date();
    
    // Format time in the specified timezone
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const timeString = timeFormatter.format(now);
    
    // Get format preference from button state
    const format24HBtn = document.querySelector(`#clock-${timezone} .format-btn.active`);
    const is24Hour = format24HBtn.textContent === '24H';
    
    const displayTime = is24Hour ? timeString : convert24To12(timeString);

    // Update time display
    const timeDisplay = document.getElementById(`time-${timezone}`);
    if (timeDisplay) {
        timeDisplay.textContent = displayTime;
    }

    // Format date
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    const dateString = dateFormatter.format(now);
    const dateDisplay = document.getElementById(`date-${timezone}`);
    if (dateDisplay) {
        dateDisplay.textContent = dateString;
    }

    // Get day of week
    const dayFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'long'
    });

    const dayOfWeek = dayFormatter.format(now);
    const dayDisplay = document.getElementById(`dayofweek-${timezone}`);
    if (dayDisplay) {
        dayDisplay.textContent = dayOfWeek;
    }

    // Get week number
    const weekNumber = getWeekNumber(now, timezone);
    const weekDisplay = document.getElementById(`weeknum-${timezone}`);
    if (weekDisplay) {
        weekDisplay.textContent = weekNumber;
    }
}

// Convert 24-hour format to 12-hour format
function convert24To12(time24) {
    const [hours, minutes, seconds] = time24.split(':');
    let hoursNum = parseInt(hours);
    const ampm = hoursNum >= 12 ? 'PM' : 'AM';
    
    hoursNum = hoursNum % 12;
    hoursNum = hoursNum ? hoursNum : 12;
    
    return `${String(hoursNum).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
}

// Get week number
function getWeekNumber(date, timezone) {
    const d = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    
    return weekNumber;
}

// Toggle between 24-hour and 12-hour format
function toggleFormat(timezone, format) {
    const buttons = document.querySelectorAll(`#clock-${timezone} .format-btn`);
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === format + 'H') {
            btn.classList.add('active');
        }
    });
    
    updateClock(timezone);
}