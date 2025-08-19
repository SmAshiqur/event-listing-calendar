document.addEventListener('DOMContentLoaded', () => {
    const calendarEl = document.getElementById('event-calendar');
    if (!calendarEl) return; 
    const calendarContainer = document.createElement('div');
    calendarContainer.className = 'calendar-split-container';
    calendarContainer.style.display = 'flex';
    calendarContainer.style.flexDirection = 'row';
    calendarContainer.style.gap = '20px';
    calendarContainer.style.width = '100%';
    calendarContainer.style.maxWidth = '1200px';
    const calendarView = document.createElement('div');
    calendarView.id = 'calendar-view';
    calendarView.style.flex = '1';
    calendarView.style.minWidth = '300px';
    const eventListView = document.createElement('div');
    eventListView.id = 'event-list-view';
    eventListView.style.flex = '1';
    eventListView.style.minWidth = '300px';
    eventListView.style.maxHeight = '850px';
    eventListView.style.overflowY = 'auto';
    eventListView.style.padding = '10px';
    calendarContainer.appendChild(calendarView);
    calendarContainer.appendChild(eventListView);
    calendarEl.parentNode.replaceChild(calendarContainer, calendarEl);

    const urlParams = new URLSearchParams(window.location.search);

    const companySlug = urlParams.get('company') || '';
    const linkStatus = urlParams.get('link') || 'Open'; // Default to "Open"


    calendarEl.dataset.company = companySlug;
    calendarEl.dataset.link = linkStatus;

    const dateInfo = null;
    const limit = 1500; // Default limit, can be adjusted

 // Use date info from FullCalendar if provided, otherwise use current month
    let fromDate, toDate;
    let allEventsHistory = [];

    if (dateInfo && dateInfo.view) {
        // Extract date range from FullCalendar view
        fromDate = dateInfo.view.activeStart;
        toDate = dateInfo.view.activeEnd;
    } else {
        // Default to current month
        const today = new Date();
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }


    const fromDateStr = '2000-01-01';
    const toDateStr = '2050-12-31';
    const apiUrl = `https://api-events.secure-api.net/api/event/get-events/?company=${companySlug}&fromDate=${fromDateStr}&toDate=${toDateStr}&limit=${limit}`;

    const currentDateBtn = document.getElementById('current-date-btn');
    let calendar;
    let allEvents = []; 
    function isMobileView() {
        return window.innerWidth <= 768;
    }
    function handleResponsiveLayout() {
        if (isMobileView()) {
            calendarContainer.style.flexDirection = 'column';
        } else {
            calendarContainer.style.flexDirection = 'row';
        }
    }
    function initCalendar(events = []) {
        if (calendar) {
            calendar.destroy(); // Destroy any existing calendar instance
        }

        // Store events globally
        window.allEvents = events;

        // Header toolbar with print button
        const headerToolbarConfig = {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listMonth'   //printButton
        };
      
        // Create popup element for event details
        const eventPopup = document.createElement('div');
        eventPopup.id = 'event-popup';
        eventPopup.style.display = 'none';
        eventPopup.style.position = 'absolute';
        eventPopup.style.zIndex = '1000';
        eventPopup.style.width = '300px';
        eventPopup.style.backgroundColor = '#fff';
        eventPopup.style.borderRadius = '8px';
        eventPopup.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
        eventPopup.style.overflow = 'hidden';
        eventPopup.style.transition = 'opacity 0.2s, transform 0.2s';
        eventPopup.style.opacity = '0';
        eventPopup.style.transform = 'translateY(10px)';
        document.body.appendChild(eventPopup);

        // Add click event listener to close popup when clicking outside
        document.addEventListener('click', function(e) {
            if (!eventPopup.contains(e.target) && e.target.className.toString().indexOf('fc-event') === -1) {
                hideEventPopup();
            }
        });

     function showEventPopup(event, jsEvent) {
    // Format dates
    const startDate = event.start ? new Date(event.start) : new Date();
    const endDate = event.end ? new Date(event.end) : new Date(startDate.getTime() + 60 * 60 * 1000);

    const formattedStartTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedEndTime = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = startDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    // Get event data
    const title = event.title || 'Untitled Event';
    const location = event.extendedProps.location || '';
    const imageUrl = event.extendedProps.image; // Do not provide a default image URL
    const uniqueKey = event.extendedProps.uniqueKey;

    // Build popup HTML with modern card design
    eventPopup.innerHTML = `
        <div style="position: relative;">
            ${imageUrl ? `
                <div class="event-image" style="height: 120px; background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('${imageUrl}') center/cover no-repeat; position: relative;">
                    <div style="position: absolute; top: 0; right: 0; padding: 8px;">
                        <div class="close-btn" style="cursor: pointer; background-color: rgba(255,255,255,0.7); width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 16px; font-weight: bold; color: #333;">×</span>
                        </div>
                    </div>
                </div>
            ` : ``}
            <div style="padding: 16px;">
                <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: bold; color: #000;">${title}</h3>
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 12px; color: #0e0e0e; line-height: normal; font-weight: normal; ">${formattedDate} • ${formattedStartTime} - ${formattedEndTime}</span>
                </div>
                ${location ? `
                    <div style="display: flex; align-items: center; margin-bottom: 12px;">
                        <span style="font-size: 12px; color: #0e0e0e; line-height: normal; font-weight: normal;">${location}</span>
                    </div>
                ` : ``}
                <button class="more-details-btn" style="width: 100%; background-color: #3f51b5; color: white; border: none; padding: 10px 16px; border-radius: 4px; font-weight: bold; cursor: pointer; transition: background-color 0.2s;">
                    More Details
                </button>
            </div>
        </div>
    `;

    // Position the popup
    const rect = jsEvent.target.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    let topPosition = rect.top + scrollTop;
    let leftPosition = rect.left + scrollLeft;

    // Adjust for mobile view
    if (window.innerWidth < 768) {
        topPosition = (window.innerHeight - 300) / 2 + scrollTop; // Center vertically
        leftPosition = (window.innerWidth - 300) / 2 + scrollLeft; // Center horizontally
    } else {
        // Check if popup would go off the bottom of the screen
        if (topPosition + 300 > window.innerHeight + scrollTop) {
            topPosition = rect.top + scrollTop - 300 - 10; // Position above the event
        } else {
            topPosition = rect.bottom + scrollTop + 10; // Position below the event
        }
    }

    eventPopup.style.top = `${topPosition}px`;
    eventPopup.style.left = `${leftPosition}px`;

    // Show the popup with animation
    eventPopup.style.display = 'block';
    setTimeout(() => {
        eventPopup.style.opacity = '1';
        eventPopup.style.transform = 'translateY(0)';
    }, 10);

    // Add event listeners for the buttons
    const closeBtn = eventPopup.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideEventPopup);
    }

    const moreDetailsBtn = eventPopup.querySelector('.more-details-btn');
    if (moreDetailsBtn && uniqueKey) {
        moreDetailsBtn.addEventListener('click', function() {
            const eventUrl = `/events/?event_key=${encodeURIComponent(uniqueKey)}&company=${encodeURIComponent(companySlug)}`;
            window.location.href = eventUrl;
        });
    }
}

        // Function to hide the event popup
        function hideEventPopup() {
            eventPopup.style.opacity = '0';
            eventPopup.style.transform = 'translateY(10px)';
            setTimeout(() => {
                eventPopup.style.display = 'none';
            }, 200);
        }

        // Main calendar initialization
        calendar = new FullCalendar.Calendar(calendarView, {
            initialView: 'dayGridMonth',
            themeSystem: 'bootstrap5',
            headerToolbar: headerToolbarConfig,
            height: 'auto',
            
            // Custom buttons for print
            customButtons: {
                printButton: {
                    text: 'FULLSCREEN',
                    click: function() {
                        printCalendar();
                    }
                }
            },

            // Handle event click
            eventClick: function (info) {
                info.jsEvent.preventDefault();
                
                // Highlight the selected event in the list
                if (typeof highlightEventInList === 'function') {
                    highlightEventInList(info.event.extendedProps.uniqueKey);
                }
                
                const uniqueKey = info.event.extendedProps.uniqueKey;
                if (uniqueKey) {
                    // Use query parameter with page template
                    const eventUrl = `/events/?event_key=${encodeURIComponent(uniqueKey)}&company=${encodeURIComponent(companySlug)}`;
                    window.location.href = eventUrl;
                }
            },

            // Handle event hover
            eventMouseEnter: function(info) {
                // Clear any existing hide timeouts
                if (window.hidePopupTimeout) {
                    clearTimeout(window.hidePopupTimeout);
                }
                
                // Show the custom popup
                showEventPopup(info.event, info.jsEvent);
            },
            
            eventMouseLeave: function() {
                // Set a timeout to hide the popup (allows moving mouse to the popup)
                window.hidePopupTimeout = setTimeout(() => {
                    hideEventPopup();
                }, 300);
            },

            eventDidMount: function (info) {
                if (new Date(info.event.start) < new Date()) {
                    info.el.style.opacity = '0.6'; // Dim past events
                }
            },
            
            // When date range changes, update the event list
            datesSet: function(dateInfo) {
                if (typeof updateEventList === 'function') {
                    updateEventList(1); // Ensure it starts from the first page
                }
            },

            eventContent: function(arg) {
                const viewType = arg.view.type;

                if (viewType === 'dayGridMonth' || viewType === 'timeGridWeek' || viewType === 'timeGridDay') {
                    // Custom rendering for grid views
                    let eventEl = document.createElement('div');
                    eventEl.className = 'fc-event-title-container';
                    eventEl.style.padding = '0px 4px';
                    eventEl.style.fontSize = '8px';
                    eventEl.style.overflow = 'hidden';
                    eventEl.style.textOverflow = 'ellipsis';
                    eventEl.style.whiteSpace = 'nowrap';

                    // Create a small blue dot
                    let dotEl = document.createElement('span');
                    dotEl.className = 'fc-event-dot';
                    dotEl.style.display = 'inline-block';
                    dotEl.style.width = '8px';
                    dotEl.style.height = '8px';
                    dotEl.style.backgroundColor = '#039BE5';
                    dotEl.style.borderRadius = '50%';
                    dotEl.style.marginRight = '5px';

                    let titleEl = document.createElement('span');
                    titleEl.className = 'fc-event-title';
                    titleEl.innerHTML = arg.event.title;

                    eventEl.appendChild(dotEl);
                    eventEl.appendChild(titleEl);

                    return { domNodes: [eventEl] };
                } else if (viewType === 'listMonth' || viewType === 'listWeek' || viewType === 'listDay') {
                    // Custom rendering for list views
                    let eventEl = document.createElement('div');
                    eventEl.className = 'fc-list-item';

                    // Check if the date has already been rendered
                    let dateKey = arg.event.start.toISOString().split('T')[0];
                    let dateEl = document.querySelector(`.fc-list-item-date[data-date="${dateKey}"]`);

                    if (!dateEl) {
                        // Date and Weekday at the top
                        dateEl = document.createElement('div');
                        dateEl.className = 'fc-list-item-date';
                        dateEl.dataset.date = dateKey;
                        dateEl.innerHTML = `
                            <span class="fc-list-item-date-full" style="font-weight: bold;">
                                ${arg.event.start ? arg.event.start.toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                }) : ''}
                            </span>
                            <span class="fc-list-item-date-weekday" style="font-weight: bold;">
                                ${arg.event.start ? arg.event.start.toLocaleString('default', { weekday: 'short' }) : ''}
                            </span>
                        `;
                        eventEl.appendChild(dateEl);
                    }

                    // Time, Dot, and Title
                    let timeTitleEl = document.createElement('div');
                    timeTitleEl.className = 'fc-list-item-time-title';

                    // Create a small blue dot
                    let dotEl = document.createElement('span');
                    dotEl.className = 'fc-event-dot';
                    dotEl.style.display = 'inline-block';
                    dotEl.style.width = '8px';
                    dotEl.style.height = '8px';
                    dotEl.style.backgroundColor = 'blue';
                    dotEl.style.borderRadius = '50%';
                    dotEl.style.marginRight = '5px';

                    let timeEl = document.createElement('span');
                    timeEl.className = 'fc-list-item-time';
                    timeEl.innerHTML = `
                        ${arg.event.start ? arg.event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        ${arg.event.end ? ` - ${arg.event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                    `;
                    timeEl.style.marginRight = '5px';

                    let titleEl = document.createElement('span');
                    titleEl.className = 'fc-list-item-title';
                    titleEl.innerHTML = arg.event.title;

                    timeTitleEl.appendChild(timeEl);
                    timeTitleEl.appendChild(dotEl);
                    timeTitleEl.appendChild(titleEl);

                    // Alternate background colors
                    const isEven = (arg.index % 2 === 0);
                    dateEl.style.backgroundColor = isEven ? '#fff' : '#d1d1d14d';
                    timeTitleEl.style.backgroundColor = isEven ? '#d1d1d14d' : '#fff';

                    eventEl.appendChild(timeTitleEl);

                    return { domNodes: [eventEl] };
                }

                // Let FullCalendar render other views normally
                return true;
            },

            // Add this to enhance how multiple events on the same day are displayed
            dayCellDidMount: function(arg) {
                // Get all events for this day
                const date = arg.date;
                const formattedDate = date.toISOString().split('T')[0];
                
                // Find events on this day
                const eventsOnDay = window.allEvents.filter(event => {
                    const eventDate = new Date(event.start);
                    return eventDate.toISOString().split('T')[0] === formattedDate;
                });
                
                // If there are multiple events, add a count indicator
                if (eventsOnDay.length > 3) {
                    const countElement = document.createElement('div');
                    countElement.style.fontSize = '10px';
                    countElement.style.textAlign = 'center';
                    countElement.style.color = '#666';
                    countElement.style.marginTop = '2px';
                    countElement.textContent = `+${eventsOnDay.length - 3} more`;
                    
                    // Append to the day cell
                    const cellContent = arg.el.querySelector('.fc-daygrid-day-bottom');
                    if (cellContent) {
                        cellContent.appendChild(countElement);
                    }
                }
            },
            
            events: events,
        });

        calendar.render();

        // Add event listener to the eventPopup to prevent auto-closing when the mouse enters it
        eventPopup.addEventListener('mouseenter', function() {
            if (window.hidePopupTimeout) {
                clearTimeout(window.hidePopupTimeout);
            }
        });

        eventPopup.addEventListener('mouseleave', function() {
            hideEventPopup();
        });

        // Function to print the calendar
        function printCalendar() {
            setTimeout(function() {
                const iframes = document.querySelectorAll('iframe');
                iframes.forEach(iframe => {
                    if (iframe.src && iframe.src.includes('ubersuggest')) {
                    iframe.remove();
                    }
                });
            }, 500);
            
            // Create a new window for printing
            const printWindow = window.open('', '_blank');
            
            // Get the current view of the calendar
            const currentView = calendar.view.type;
            
            // Create print-friendly CSS
            const printStyles = `
            /* General styles for the calendar */
            body {
                font-family: Arial, sans-serif;
                padding: 20px;
                max-width: 1200px;
                margin: 0 auto;
                background-color: #fff;
            }

            .print-header {
                text-align: center;
                margin-bottom: 20px;
            }

            .print-header h1 {
                margin: 0;
                font-size: 24px;
                color: #333;
            }

            .print-header p {
                margin: 5px 0 0;
                font-size: 14px;
                color: #666;
            }

            #calendar {
                width: 100%;
                height: 650px;
                margin: 20px 0;
                border: 1px solid #ddd;
                border-radius: 8px;
                overflow: hidden;
            }

            .fc {
                font-family: Arial, sans-serif;
                font-size: 14px;
                color: #333;
            }

            .fc-toolbar-title {
                font-size: 18px;
                font-weight: bold;
            }

            .fc-daygrid-day-number {
                font-weight: bold;
            }

            .fc-daygrid-day-events {
                margin-top: 5px;
            }

            .fc-daygrid-day-event {
                padding: 5px;
                margin-bottom: 5px;
                background-color: #f0f0f0;
                border: 1px solid #ddd;
                border-radius: 4px;
            }

            .fc-daygrid-day-event:hover {
                background-color: #e0e0e0;
            }

            .fc-daygrid-day-event .fc-event-title {
                font-size: 12px;
                color: #333;
            }

            .fc-daygrid-day-event .fc-event-time {
                font-size: 10px;
                color: #666;
            }

            /* Print-specific styles */
            @media print {
                .no-print {
                    display: none;
                }

                body {
                    background-color: transparent;
                    color: #000;
                }

                #calendar {
                    height: auto;
                    min-height: 500px;
                    border: none;
                    box-shadow: none;
                }

                .fc {
                    background-color: #fff;
                }

                .fc-toolbar-title {
                    color: #000;
                }

                .fc-daygrid-day-number {
                    color: #000;
                }

                .fc-daygrid-day-event {
                    background-color: #fff;
                    border-color: #000;
                    color: #000;
                }

                .fc-daygrid-day-event .fc-event-title,
                .fc-daygrid-day-event .fc-event-time {
                    color: #000;
                }
            }
            `;
            
            // Write the content to the new window
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Events Calendar</title>
                    <meta http-equiv="Content-Security-Policy" content="frame-src 'none'; frame-ancestors 'none';">
                    <link href="https://cdn.jsdelivr.net/npm/fullcalendar@5.10.1/main.min.css" rel="stylesheet">
                    <style>${printStyles}</style>
                </head>
                <body>
                
                    <div id="print-calendar"></div>
                    
                    <script src="https://cdn.jsdelivr.net/npm/fullcalendar@5.10.1/main.min.js"></script>
                    <script>
                        // Initialize a new calendar for printing
                        document.addEventListener('DOMContentLoaded', function() {
                            const calendarEl = document.getElementById('print-calendar');
                            const calendar = new FullCalendar.Calendar(calendarEl, {
                                initialView: '${currentView}',
                                headerToolbar: {
                                    left: '',
                                    center: 'title',
                                    right: ''
                                },
                                events: ${JSON.stringify(events)},
                                height: 'auto'
                            });
                            calendar.render();
                            
                            // Automatically open print dialog after calendar is rendered
                            setTimeout(function() {
                                // Uncomment the line below to automatically trigger print
                                // window.print();
                            }, 1000);
                        });
                    </script>
                </body>
                </html>
            `);
            
            printWindow.document.close();
        }
    }
    function getWeekdayFromDate(dateStr) {
        // Split the date string (e.g., "2025-08-02" into year, month, day)
        const [year, month, day] = dateStr.split('-').map(Number);
        
        // Adjust month and year for Zeller's Congruence (March = 1, February = 12)
        let m = (month - 3 + 12) % 12 || 12; // Adjust month (1-12)
        let y = month <= 2 ? year - 1 : year; // Adjust year if January or February
        
        // Zeller's Congruence formula
        const k = day; // Day of the month
        const j = Math.floor(y / 100); // Century
        const i = y % 100; // Year within century
        
        const h = (k + Math.floor((13 * (m + 1)) / 5) + i + Math.floor(i / 4) + Math.floor(j / 4) + 5 * j) % 7;
        
        // Map h (0 = Saturday, 1 = Sunday, ..., 6 = Friday) to weekday names
        const weekdays = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
        return weekdays[h];
    }
    
    function updateEventList(page = 1) {
        // Clear the current list
        eventListView.innerHTML = '';
    
        // Filter events that are in the future
        const today = new Date(); 
        const futureEvents = allEvents.filter(event => {
            const eventDate = new Date(event.start); 
            return eventDate >= today;
        });
    
        // Sort events by date (oldest first)
        futureEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
    
        // Create event list header
        const listHeader = document.createElement('div');
        listHeader.className = 'event-list-header';
        listHeader.innerHTML = 
            `<h3 style="margin-bottom: 0px; padding-bottom: 10px; padding-top: 0px; margin-top: 0px; border-bottom: 1px solid #ddd; position: sticky; top: 0; background: white; z-index: 10;">
                Upcoming Events
            </h3>`;
        eventListView.appendChild(listHeader);
    
        // Show empty state if no events
        if (futureEvents.length === 0) {
            const noEvents = document.createElement('div');
            noEvents.className = 'no-events-message';
            noEvents.style.padding = '20px';
            noEvents.style.textAlign = 'center';
            noEvents.style.color = '#666';
            noEvents.innerHTML = 'No upcoming events scheduled.';
            eventListView.appendChild(noEvents);
            return;
        }
    
        // Group events by date
        const eventsByDate = {};
        futureEvents.forEach(event => {
            const eventDate = event.start ? event.start.split('T')[0] : null;
            const dateKey = eventDate;
            if (!eventsByDate[dateKey]) {
                eventsByDate[dateKey] = [];
            }
            eventsByDate[dateKey].push(event);
        });
    
        // Get sorted date keys (oldest first)
        const dateKeys = Object.keys(eventsByDate).sort();
        
        // Create flat list of all events with their date keys for pagination
        const allEventsFlat = [];
        dateKeys.forEach(dateKey => {
            eventsByDate[dateKey].forEach(event => {
                allEventsFlat.push({
                    event: event,
                    dateKey: dateKey
                });
            });
        });
        
        // Pagination setup - exactly 4 events per page
        const eventsPerPage = 5;
        const totalEvents = allEventsFlat.length;
        const totalPages = Math.ceil(totalEvents / eventsPerPage);
        
        // Make sure page is valid
        page = Number(page) || 1;
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        
        // Calculate which events to show on this page
        const startEventIndex = (page - 1) * eventsPerPage;
        const endEventIndex = Math.min(startEventIndex + eventsPerPage, totalEvents);
        const eventsForThisPage = allEventsFlat.slice(startEventIndex, endEventIndex);
        
        // Create events container
        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'events-container';
        
        // Track last displayed date to know when to add headers
        let lastDisplayedDateKey = null;
        
        // Display events for the current page with appropriate date headers
        eventsForThisPage.forEach(item => {
            const currentDateKey = item.dateKey;
            
            // If this is a new date or the first event on the page, add a date header
            if (currentDateKey !== lastDisplayedDateKey) {
                console.log("raw date", currentDateKey); // Logs just "2025-08-02"
                
                // Get weekday without new Date() using the custom function
                const weekday = getWeekdayFromDate(currentDateKey);
                const month = currentDateKey.split('-')[1]; // e.g., "08"
                const day = currentDateKey.split('-')[2]; // e.g., "02"
                const formattedDate = `${weekday}, ${monthToName(month)} ${day}`; // e.g., "Saturday, August 2"
                
                // Add date header
                const dateHeader = document.createElement('div');
                dateHeader.className = 'event-date-header';
                dateHeader.style.margin = '15px 0 10px 0';
                dateHeader.style.fontWeight = 'bold';
                dateHeader.style.color = '#0e0e0e';
                dateHeader.style.fontSize = '1.1rem';
                dateHeader.innerHTML = formattedDate;
                eventsContainer.appendChild(dateHeader);
                
                // Update last displayed date
                lastDisplayedDateKey = currentDateKey;
            }
            
            // Add event card
            eventsContainer.appendChild(createEventCard(item.event));
        });
        
        eventListView.appendChild(eventsContainer);
        
        // Add loading animation container (initially hidden)
        const loadingContainer = document.createElement('div');
        loadingContainer.className = 'loading-container';
        loadingContainer.style.display = 'none';
        loadingContainer.style.textAlign = 'center';
        loadingContainer.style.padding = '20px 0';
        eventListView.appendChild(loadingContainer);
        
        // Add pagination if needed
        if (totalPages > 1) {
            addPagination(page, totalPages, loadingContainer);
        }
    }
    
    // Helper function to convert month number to name
    function monthToName(month) {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return months[parseInt(month, 10) - 1];
    }
    function addPagination(currentPage, totalPages, loadingContainer) {
        // Create pagination container
        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container';
        paginationContainer.style.display = 'flex';
        paginationContainer.style.justifyContent = 'center';
        paginationContainer.style.alignItems = 'center';
        paginationContainer.style.gap = '10px';
        paginationContainer.style.marginTop = '30px';
        paginationContainer.style.userSelect = 'none';
        
        // Add CSS for pagination if not already added
        if (!document.getElementById('pagination-style')) {
            const style = document.createElement('style');
            style.id = 'pagination-style';
            style.textContent = `
                .pagination-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border: none;
                    border-radius: 50%;
                    background-color: transparent;
                    color: #555;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .pagination-button:hover:not(:disabled) {
                    background-color: #f0f0f0;
                }
                
                .pagination-button.active {
                    background-color: #4a90e2;
                    color: white;
                }
                
                .pagination-button:disabled {
                    opacity: 0.4;
                    cursor: default;
                }
                
                .pagination-nav {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border: none;
                    border-radius: 50%;
                    background-color: transparent;
                    color: #555;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .pagination-nav:hover:not(:disabled) {
                    background-color: #f0f0f0;
                }
                
                .pagination-nav:disabled {
                    opacity: 0.4;
                    cursor: default;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Create "Previous" button
        const prevButton = document.createElement('button');
        prevButton.className = 'pagination-nav';
        prevButton.disabled = currentPage === 1;
        prevButton.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';
        prevButton.addEventListener('click', () => {
            showLoading(loadingContainer);
            setTimeout(() => {
                updateEventList(currentPage - 1);
            }, 500);
        });
        paginationContainer.appendChild(prevButton);
        
        // Create page buttons
        const maxButtonsToShow = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxButtonsToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxButtonsToShow - 1);

        startPage = Math.max(1, endPage - maxButtonsToShow + 1);

        
        // Adjust start if we're at the end
        if (endPage - startPage + 1 < maxButtonsToShow) {
            startPage = Math.max(1, endPage - maxButtonsToShow + 1);
        }
        
        // Add first page button if needed
        if (startPage > 1) {
            const firstButton = document.createElement('button');
            firstButton.className = 'pagination-button';
            firstButton.textContent = '1';
            firstButton.addEventListener('click', () => {
                showLoading(loadingContainer);
                setTimeout(() => {
                    updateEventList(1);
                }, 500);
            });
            paginationContainer.appendChild(firstButton);
            
            // Add ellipsis if needed
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.color = '#888';
                paginationContainer.appendChild(ellipsis);
            }
        }
        
        // Add page number buttons
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = 'pagination-button';
            if (i === currentPage) pageButton.classList.add('active');
            pageButton.textContent = i;
            pageButton.addEventListener('click', () => {
                if (i !== currentPage) {
                    showLoading(loadingContainer);
                    setTimeout(() => {
                        updateEventList(i);
                    }, 500);
                }
            });
            paginationContainer.appendChild(pageButton);
        }
        
        // Add last page button if needed
        if (endPage < totalPages) {
            // Add ellipsis if needed
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.color = '#888';
                paginationContainer.appendChild(ellipsis);
            }
            
            const lastButton = document.createElement('button');
            lastButton.className = 'pagination-button';
            lastButton.textContent = totalPages;
            lastButton.addEventListener('click', () => {
                showLoading(loadingContainer);
                setTimeout(() => {
                    updateEventList(totalPages);
                }, 500);
            });
            paginationContainer.appendChild(lastButton);
        }
        
        // Create "Next" button
        const nextButton = document.createElement('button');
        nextButton.className = 'pagination-nav';
        nextButton.disabled = currentPage === totalPages;
        nextButton.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';
        nextButton.addEventListener('click', () => {
            showLoading(loadingContainer);
            setTimeout(() => {
                updateEventList(currentPage + 1);
            }, 500);
        });
        paginationContainer.appendChild(nextButton);
        
        eventListView.appendChild(paginationContainer);
    }
    function showLoading(container) {
        // Show the loading container
        container.style.display = 'block';
        container.innerHTML = '';
        
        // Create spinner
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.style.display = 'inline-block';
        spinner.style.width = '30px';
        spinner.style.height = '30px';
        spinner.style.border = '3px solid rgba(0, 0, 0, 0.1)';
        spinner.style.borderRadius = '50%';
        spinner.style.borderTop = '3px solid #4a90e2';
        spinner.style.animation = 'spin 1s linear infinite';
        
        container.appendChild(spinner);
    }
    function initializeEventList() {
        updateEventList(1);
    }
    window.addEventListener('DOMContentLoaded', initializeEventList);
    function createEventCard(event) {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.dataset.eventKey = event.extendedProps.uniqueKey;
        card.style.display = 'flex';
        card.style.marginBottom = '15px';
        card.style.padding = '10px';
        card.style.borderRadius = '5px';
        card.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
        card.style.transition = 'all 0.3s ease';
        card.style.cursor = 'pointer';
        card.style.backgroundColor = 'white';
        
        // For past events
        if (new Date(event.start) < new Date()) {
            card.style.opacity = '0.6';
        }
        
        // Handle click on event card
        card.addEventListener('click', () => {
            const uniqueKey = event.extendedProps.uniqueKey;
            if (uniqueKey) {
                const eventUrl = `/events/?event_key=${encodeURIComponent(uniqueKey)}&company=${encodeURIComponent(companySlug)}`;
                window.location.href = eventUrl;
            }
        });
        
        // Extract event time information
        const startTime = event.start && !isDefaultMidnight(event.start)
            ? new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : null;
        const endTime = event.end && !isDefaultMidnight(event.end)
            ? new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : null;
        const timeRange = startTime ? (endTime ? `${startTime} - ${endTime}` : startTime) : 'All day';
        
        // Create the content container
        const contentContainer = document.createElement('div');
        contentContainer.style.flex = '1';
        
        // Add title
        const title = document.createElement('div');
        title.style.fontWeight = 'bold';
        title.style.color = '#000';
        title.style.lineHeight = 'normal';
        title.style.fontSize = '1rem';
        title.style.marginBottom = '5px';
        title.textContent = event.title;
        contentContainer.appendChild(title);
        
        // Add time
        const time = document.createElement('div');
        time.style.fontSize = '0.85rem';
        time.style.color = '#555';
        time.style.lineHeight = 'normal';
        time.style.marginBottom = '3px';
        time.textContent = timeRange;
        contentContainer.appendChild(time);
        
        // Add location
        const location = document.createElement('div');
        location.style.fontSize = '0.85rem';
        location.style.lineHeight = 'normal';
        location.style.color = '#666';
        location.textContent = event.extendedProps.location || '';
        contentContainer.appendChild(location);
        
        // Conditionally add image container if an image URL is provided
        if (event.extendedProps.image && event.extendedProps.image.trim() !== '') {
            // Create the image container
            const imageContainer = document.createElement('div');
            imageContainer.style.width = '80px';
            imageContainer.style.minWidth = '80px';
            imageContainer.style.height = '80px';
            imageContainer.style.marginRight = '15px';
            imageContainer.style.borderRadius = '4px';
            imageContainer.style.overflow = 'hidden';
            imageContainer.style.backgroundColor = '#f0f0f0';
            
            // Add the image
            const image = document.createElement('img');
            image.style.width = '100%';
            image.style.height = '100%';
            image.style.objectFit = 'cover';
            image.alt = event.title;
            image.src = event.extendedProps.image;
            
            imageContainer.appendChild(image);
            card.appendChild(imageContainer);
        }
        
        // Add content container to the card
        card.appendChild(contentContainer);
        
        return card;
    }
    function highlightEventInList(uniqueKey) {
        // Remove highlight from all events
        document.querySelectorAll('.event-card').forEach(card => {
            card.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
            card.style.borderLeft = 'none';
        });
        
        // Add highlight to the selected event
        const selectedCard = document.querySelector(`.event-card[data-event-key="${uniqueKey}"]`);
        if (selectedCard) {
            selectedCard.style.boxShadow = '0 3px 10px rgba(0,0,0,0.2)';
            selectedCard.style.borderLeft = '4px solid #1a73e8';
            
            // Scroll to the selected event
            selectedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    function fetchEvents() {
        // Validate companySlug
        if (!companySlug) {
            console.error("No company slug provided");
            // Initialize an empty calendar
            initCalendar([]);
            return;
        }


        fetch(apiUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`API responded with status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                console.log("API Response:", data);
                
                if (data.succeeded && Array.isArray(data.data)) {
                    console.log(`Successfully loaded ${data.data.length} events`);
                    
                    allEvents = data.data.map(event => {
                        // Process each event
                        return parseEventData(event);
                    });

                    initCalendar(allEvents);
                } else {
                    // Log error details
                    console.log("No events found or API returned an error", data);
                    initCalendar([]);
                }
            })
            .catch((error) => {
                console.error("Error fetching events:", error);
                // Initialize an empty calendar instead of showing an error
                initCalendar([]);
            });
    }
    fetchEvents();  
    handleResponsiveLayout();
    window.addEventListener('resize', handleResponsiveLayout);
        if (currentDateBtn) {
            currentDateBtn.addEventListener('click', () => {
                calendar.today();
            });
        }
    });
    function isDefaultMidnight(date) {
        if (!date) return true;
        
        // If it's a string in HH:MM:SS format
        if (typeof date === 'string' && date.includes(':')) {
            return date === '00:00:00';
        }
        
        // If it's a Date object
        const d = new Date(date);
        return d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0;
    }
    function parseEventData(event) {
        
        // Handle date and time formatting
        let eventDate = event.eventDate ? event.eventDate.split('T')[0] : null;
        let startTime = event.startTime && !isDefaultMidnight(event.startTime) ? event.startTime : null;
        let endTime = event.endTime && !isDefaultMidnight(event.endTime) ? event.endTime : null;
        
        // Determine if this is an all-day event (no specific time)
        const isAllDay = !startTime;
        
        // Create formatted start and end datetime strings
        let start = eventDate ? (startTime ? `${eventDate}T${startTime}` : eventDate) : null;
        let end = eventDate && endTime ? `${eventDate}T${endTime}` : null;
        
        return {
            title: event.title || 'Untitled Event',
            start: start,
            end: end,
            allDay: isAllDay,
            extendedProps: {
                location: event.location || '',
                image: event.image || '',
                eventUrl: event.eventUrl || null,
                uniqueKey: event.uniqueKey || null,
                details: event.smallDetails || ''
            }
        };
    }
