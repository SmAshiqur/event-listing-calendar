<?php
/*
Plugin Name: Event Listing Calendar
Plugin URI: https://masjidsolutions.net/
Description: A plugin to display events in a calendar and list format using FullCalendar and Flatpickr.
Version: 3.2
Author: MASJIDSOLUTIONS
Author URI: https://masjidsolutions.net/
License: GPL2
GitHub Plugin URI: SmAshiqur/event-listing-calendar
*/
if (!defined('ABSPATH')) {
    exit;
}
// Fixed version constant to match header
define('ELC_VERSION', '3.1');
define('ELC_PLUGIN_URL', plugin_dir_url(FILE));
define('ELC_PLUGIN_PATH', plugin_dir_path(FILE));
require 'lib/plugin-update-checker-master/plugin-update-checker.php';
use YahnisElsts\PluginUpdateChecker\v5\PucFactory;
$updateChecker = PucFactory::buildUpdateChecker(
    'https://github.com/SmAshiqur/event-listing-calendar',
    FILE,
    'event-listing-calendar' 
);
// Set the branch (change to 'master' if that's your default branch)
$updateChecker->setBranch('main');
// Enable release assets if you plan to use GitHub releases
$updateChecker->getVcsApi()->enableReleaseAssets();



// Enqueue scripts and styles
function elc_enqueue_scripts() {
    wp_enqueue_script('jquery');
    wp_enqueue_script('bootstrap', 'https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js', ['jquery'], null, true);

    // FullCalendar
    wp_enqueue_script('elc-fullcalendar-js', 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.global.min.js', [], null, true);
    wp_enqueue_style('elc-fullcalendar-css', 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.min.css');

    // Flatpickr
    wp_enqueue_script('elc-flatpickr-js', 'https://cdn.jsdelivr.net/npm/flatpickr', [], null, true);
    wp_enqueue_style('elc-flatpickr-css', 'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css');

    // Tippy.js and Popper.js
    wp_enqueue_style('tippy-animations', 'https://unpkg.com/tippy.js@6/animations/scale.css');
    wp_enqueue_script('popper-js', 'https://unpkg.com/@popperjs/core@2', [], null, true);
    wp_enqueue_script('tippy-js', 'https://unpkg.com/tippy.js@6', ['popper-js'], null, true);

    // Custom JS and CSS
    wp_enqueue_script('elc-script', plugin_dir_url(__FILE__) . 'event-listing.js', ['jquery', 'elc-flatpickr-js', 'elc-fullcalendar-js', 'tippy-js'], null, true);
    wp_enqueue_style('elc-style', plugin_dir_url(__FILE__) . 'event-listing.css');
}
add_action('wp_enqueue_scripts', 'elc_enqueue_scripts');

// Shortcode to display the calendar and Flatpickr
function elC_shortcode($atts) {
    $atts = shortcode_atts(['company' => 'default-company', 'link' => 'Open'], $atts, 'event_listing_calendar');
    $company_slug = esc_attr($atts['company']);
    $link_status = esc_attr($atts['link']); // Get link status (Open/Close)

    return '
        <div id="calendar-toolbar" style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; display: none;">
            <div class="date-picker-container-div">
                <button id="current-date-btn">Today</button>
                <input type="text" id="date-range-picker" placeholder="Select date range..." style="padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; display: none;">
            </div>
        </div>
        <div id="event-calendar" data-company="' . $company_slug . '" data-link="' . $link_status . '"></div>
        <div id="event-details-container" style="margin-top: 1rem;"></div>
         <!-- Event Modal -->

        
        <!-- Calendar container with proper structure -->
        <div class="calendar-container">
            <!-- Main calendar view -->
            <div id="calendar-view"></div>
            
            <!-- Hidden print-specific container -->
            <div id="calendar-print-area" style="display: none;"></div>
        </div>


    ';
}




// Register custom rewrite rules for event detail pages
function elc_add_rewrite_rules() {
    add_rewrite_rule(
        'event/([^/]+)/?$',
        'index.php?event_id=$matches[1]',
        'top'
    );
}
add_action('init', 'elc_add_rewrite_rules');

// Register custom query var for event ID
function elc_register_query_vars($vars) {
    $vars[] = 'event_id';
    return $vars;
}
add_action('query_vars', 'elc_register_query_vars');

// Handle custom event detail template
function elc_template_include($template) {
    if (get_query_var('event_id')) {
        $event_template = plugin_dir_path(__FILE__) . 'templates/event-template.php';
        if (file_exists($event_template)) {
            return $event_template;
        }
    }
    return $template;
}
add_action('template_include', 'elc_template_include');

// Create a function to get event details by uniqueKey
function elc_get_event_details($unique_key) {
    // Make sure we have a valid key
    if (empty($unique_key)) {
        error_log("ERROR: Empty event key provided");
        return null;
    }
    
    // IMPORTANT: Check if company is provided in URL first
    $company_slug = '';
    
    // Priority 1: URL parameter
    if (isset($_GET['company'])) {
        $company_slug = sanitize_text_field($_GET['company']);
        error_log("Company slug from URL parameter: " . $company_slug);
    } 
    // Priority 2: Stored option
    else {
        $company_slug = get_option('elc_company_slug', '');
        error_log("Company slug from stored option: " . $company_slug);
    }
    
    // Priority 3: Fallback to default
    if (empty($company_slug)) {
        // Default company slug - CHANGE THIS to match your Postman request
        $company_slug = 'crmosque'; 
        error_log("Using default company slug: " . $company_slug);
    }
    
    // Construct the API URL
    $api_url = "https://api-events.secure-api.net/api/event/event-details/{$company_slug}/{$unique_key}";
    
    // Log debugging information
    error_log("DEBUG - Fetching event with key: {$unique_key}");
    error_log("DEBUG - Company slug: {$company_slug}");
    error_log("DEBUG - Full API URL: {$api_url}");
    
    // Make the API request
    $response = wp_remote_get($api_url, [
        'timeout' => 15, // Increase timeout
        'sslverify' => false // Only use this for testing, not in production
    ]);
    
    // Check for errors
    if (is_wp_error($response)) {
        error_log("API Request Failed: " . $response->get_error_message());
        return null;
    }
    
    // Get the response code
    $response_code = wp_remote_retrieve_response_code($response);
    error_log("API Response Code: " . $response_code);
    
    // Get and parse the body
    $body = wp_remote_retrieve_body($response);
    error_log("API Response Body: " . substr($body, 0, 500) . "..."); // Log first 500 chars to avoid huge logs
    
    $data = json_decode($body, true);
    
    // Check for successful response
    if (isset($data['succeeded']) && $data['succeeded'] && isset($data['data'])) {
        $event = $data['data'];
        
        // Process date and time
        if (!empty($event['eventDate'])) {
            // Format the date (remove the time part if present)
            $event['eventDate'] = date('Y-m-d', strtotime($event['eventDate']));
        }
        
        // Process start time (ensure it's in proper format)
        if (!empty($event['startTime'])) {
            // Check if the time is already formatted as H:i:s or needs formatting
            if (preg_match('/^\d{2}:\d{2}:\d{2}$/', $event['startTime'])) {
                // Already in proper format
            } else {
                // Try to format it
                $event['startTime'] = date('H:i:s', strtotime($event['startTime']));
            }
        }
        
        // Process end time (ensure it's in proper format)
        if (!empty($event['endTime'])) {
            // Check if the time is already formatted as H:i:s or needs formatting
            if (preg_match('/^\d{2}:\d{2}:\d{2}$/', $event['endTime'])) {
                // Already in proper format
            } else {
                // Try to format it
                $event['endTime'] = date('H:i:s', strtotime($event['endTime']));
            }
        }
        
        error_log("Event fetched successfully: " . $event['title']);
        return $event;
    } else {
        // Log the error from the API if available
        if (isset($data['message'])) {
            error_log("API Error Message: " . $data['message']);
        } else {
            error_log("Unknown API error. Full response: " . $body);
        }
        error_log("Event fetch failed or missing data");
        return null;
    }
}

// Modify this function to make sure company parameter is passed to the event detail page
function elc_modify_event_url($url, $event_key) {
    // Get the company parameter - from shortcode or default
    $company_slug = isset($_GET['company']) ? sanitize_text_field($_GET['company']) : get_option('elc_company_slug', 'crmosque');
    
    // Add the company parameter to the URL
    if (strpos($url, '?') !== false) {
        $url .= '&company=' . $company_slug;
    } else {
        $url .= '?company=' . $company_slug;
    }
    
    return $url;
}



// Add AJAX endpoint to get event details
function elc_ajax_get_event_details() {
    if (isset($_GET['event_id'])) {
        $event_details = elc_get_event_details(sanitize_text_field($_GET['event_id']));
        wp_send_json($event_details);
    }
    wp_send_json_error('No event ID provided');
}
add_action('wp_ajax_elc_get_event_details', 'elc_ajax_get_event_details');
add_action('wp_ajax_nopriv_elc_get_event_details', 'elc_ajax_get_event_details');

// Flush rewrite rules on plugin activation
function elc_activate() {
    elc_add_rewrite_rules();
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'elc_activate');

// Add a custom page template for event details
function elc_add_page_template($templates) {
    $templates['event-detail-template.php'] = 'Event Detail Template';
    return $templates;
}
add_filter('theme_page_templates', 'elc_add_page_template');

// Load the template file
function elc_load_page_template($template) {
    if (is_page_template('event-detail-template.php')) {
        $template = plugin_dir_path(__FILE__) . 'templates/event-detail-template.php';
    }
    return $template;
}
add_filter('page_template', 'elc_load_page_template');

// Add shortcode for displaying event details
function elc_event_detail_shortcode($atts) {
    $atts = shortcode_atts(array(
        'key' => '', // Option to manually specify a key
    ), $atts, 'event_detail');
    
    // Get event key with improved priority checking
    $event_key = '';
    
    // 1. Check shortcode attribute first (highest priority)
    if (!empty($atts['key'])) {
        $event_key = $atts['key'];
        error_log("Event key from shortcode attribute: " . $event_key);
    } 
    // 2. Check GET parameter (medium priority)
    elseif (isset($_GET['event_key'])) {
        $event_key = sanitize_text_field($_GET['event_key']);
        error_log("Event key from GET parameter: " . $event_key);
    }
    // 3. Check query var (low priority)
    elseif (get_query_var('event_id')) {
        $event_key = get_query_var('event_id');
        error_log("Event key from query var: " . $event_key);
    }
    
    // Debug output
    error_log("Shortcode called with final event_key: " . $event_key);
    
    if (empty($event_key)) {
        error_log("No event key found in the request");
        return '<div class="event-not-found">
            <h2>Event Not Found</h2>
            <p>No event key was provided. Please select an event from the calendar.</p>
        </div>';
    }
    
    // Get event details with our improved function
    $event = elc_get_event_details($event_key);
    
    if (!$event) {
        error_log("Event not found for key: " . $event_key);
        return '<div class="event-not-found">
            <h2>Event Not Found</h2>
            <p>Sorry, the event you\'re looking for could not be found or has been removed.</p>
            <p><small>Debug info: Attempted to find event with key: ' . esc_html($event_key) . '</small></p>
            <a href="' . esc_url(home_url()) . '" class="btn btn-primary">Back to Home</a>
        </div>';
    }
    
    // Return event details HTML - Using output buffering for cleaner code
    ob_start();
    ?>


    <style>
        .event-detail-content {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 20px;
            max-width: 1200px;
            margin: 0 auto;
            padding: 15px;
        }
        
        @media (min-width: 768px) {
            .event-detail-content {
                flex-direction: row;
                justify-content: space-between;
            }
        }
        
        .event-info {
            flex: 1;
            width: 100%;
        }
        
        @media (min-width: 768px) {
            .event-info {
                margin-right: 20px;
                width: 60%;
            }
        }
        
        .event-image {
            width: 100%;
            max-width: 500px;
            margin: 0 auto;
        }
        
        @media (min-width: 768px) {
            .event-image {
                width: 35%;
            }
        }
        
        .event-image img {
            width: 100%;
            height: auto;
            border-radius: 8px;
            object-fit: cover;
        }
        
        .event-title {
            font-size: 1.5rem;
            margin-bottom: 15px;
            color: #333;
        }
        
        @media (min-width: 768px) {
            .event-title {
                font-size: 2rem;
            }
        }

          /* Countdown Styles */
        .event-countdown {
            border-radius: 12px;
            padding: 0px;
            margin-bottom: 20px;
            margin-top: 20px;
            display: flex;
            align-items: center;
        }

        @media (max-width: 768px) {
            .event-countdown {
                flex-direction: column;
                align-items: baseline;
                gap: 12px;
            }
        }
                
        .event-countdown-title {
            font-size: 1.2rem;
            font-weight: 700;
            color: #000;
            margin-bottom: 0px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .countdown-container {
            display: flex;
            /* justify-content: center; */
            gap: 15px;
            width: 100%;
        }
        
        .countdown-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            background-color: white;
            border-radius: 8px;
            padding: 10px;
            min-width: 70px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .countdown-item-value {
            font-size: 2rem;
            font-weight: 700;
            color: #272727;
            line-height: 1;
            margin-bottom: 5px;
        }
        
        .countdown-item-label {
            font-size: 0.8rem;
            color: #666;
            text-transform: uppercase;
        }
        
        /* Event At A Glance Styles */
        .event-at-a-glance {
            background-color: #f8f9fa;
            border-radius: 4px;
            padding: 12px;
            margin-bottom: 20px;
            border: 1px solid rgba(0,0,0,0.05);
        }
        
        .event-at-a-glance-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: #333;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .event-at-a-glance-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .event-glance-item {
            display: flex;
            align-items: center;
            gap: 12px;
            background-color: white;
            border-radius: 8px;
            padding: 12px;
            border: 1px solid rgba(0,0,0,0.1);
        }
        
        .event-glance-item-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 8px;
            background-color: var(--primary-color-light, #e6f2ff);
            color: var(--primary-color, #007bff);
        }
        
        .event-glance-item-icon svg {
            width: 24px;
            height: 24px;
        }
        
        .event-glance-item-content {
            flex-grow: 1;
        }
        
        .event-glance-item-content-title {
            font-weight: 600;
            color: #0e0e0e;
            margin-bottom: 4px;
            font-size: 0.9rem;
        }
        
        .event-glance-item-content-detail {
            color: #333;
            font-size: 1rem;
            line-height: 1.4;
        }
        
        /* Social Share Buttons Styles */
        .social-share-container {
            margin-top: 20px;
            background-color: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            border: 1px solid rgba(0,0,0,0.05);
        }
        
        .social-share-label {
            display: block;
            margin-bottom: 15px;
            font-weight: 600;
            color: #333;
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .social-share-buttons {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .social-share-buttons a {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            border-radius: 8px;
            text-decoration: none;
            color: white;
            transition: transform 0.2s, opacity 0.2s, background-color 0.2s;
            background-color: var(--social-icon-bg, #333);
        }
        
        .social-share-buttons a:hover {
            opacity: 0.9;
            transform: scale(1.05);
        }
        
        .social-share-buttons .facebook {
            --social-icon-bg: #3b5998;
        }
        
        .social-share-buttons .twitter {
            --social-icon-bg: #1da1f2;
        }
        
        .social-share-buttons .linkedin {
            --social-icon-bg: #0077b5;
        }
        
        .social-share-buttons .whatsapp {
            --social-icon-bg: #25d366;
        }
        
        .social-share-buttons a i {
            font-size: 18px;
        }
        
        /* Action Buttons */
        .event-action {
            margin-top: 20px;
        }
        
        .event-action button {
            width: 100%;
            max-width: 300px;
            background-color: var(--primary-color, #007bff);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }
        
        .event-action button:hover {
            background-color: var(--primary-darker-color, #0056b3);
        }
    </style>

    <!-- Include Font Awesome for social icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <!-- Include Lucide Icons -->
    <script src="https://unpkg.com/lucide@0.321.0/dist/umd/lucide.js"></script>

    <div class="event-detail-content">
        <div class="event-info">
            <h1 class="event-title"><?php echo esc_html($event['title']); ?></h1>


        
            
            <?php if (!empty($event['eventDate']) || !empty($event['location'])): ?>
                <div class="event-at-a-glance">
                    <!-- <div class="event-at-a-glance-title">
                        Event at a Glance
                    </div> -->
                    
                    <div class="event-at-a-glance-grid">
                        <?php if (!empty($event['eventDate'])): ?>
                            <div class="event-glance-item">
                                <div class="event-glance-item-icon">
                                    <i data-lucide="calendar"></i>
                                </div>
                                <div class="event-glance-item-content">
                                    <div class="event-glance-item-content-title">Date & Time</div>
                                    <div class="event-glance-item-content-detail">
                                        <?php 
                                        $date = new DateTime($event['eventDate']);
                                        echo esc_html($date->format('F j, Y'));

                                        if (!empty($event['startTime']) && $event['startTime'] !== '00:00:00') {
                                            $start_time = new DateTime($event['startTime']);
                                            echo ' | ' . esc_html($start_time->format('g:i A'));

                                            if (!empty($event['endTime']) && $event['endTime'] !== '00:00:00') {
                                                $end_time = new DateTime($event['endTime']);
                                                echo ' - ' . esc_html($end_time->format('g:i A'));
                                            }
                                        }
                                        ?>
                                    </div>
                                </div>
                            </div>
                        <?php endif; ?>
                        
                        <?php if (!empty($event['location'])): ?>
                            <div class="event-glance-item">
                                <div class="event-glance-item-icon">
                                    <i data-lucide="map-pin"></i>
                                </div>
                                <div class="event-glance-item-content">
                                    <div class="event-glance-item-content-title">Location</div>
                                    <div class="event-glance-item-content-detail">
                                        <?php echo esc_html($event['location']); ?>
                                    </div>
                                </div>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endif; ?>
            
            <?php if (!empty($event['smallDetails']) && $event['smallDetails'] !== '<p><br data-cke-filler="true"></p>'): ?>
                <div class="event-description">
                    <?php echo wp_kses_post($event['smallDetails']); ?>
                </div>
            <?php endif; ?>

                    <?php 
                    // Check if event date is in the future
                    $event_date_time = new DateTime($event['eventDate']);
                    $start_time = !empty($event['startTime']) && $event['startTime'] !== '00:00:00' 
                        ? new DateTime($event['eventDate'] . ' ' . $event['startTime'])
                        : $event_date_time;
                    
                    $now = new DateTime();
                    
                    if ($start_time > $now): 
                    ?>
                        <!-- <div class="event-countdown">
                            <div class="event-countdown-title">
                                <i data-lucide="alarm-clock"></i> 
                                EVENT STARTS IN
                            </div>
                            
                            <div class="countdown-container" id="event-countdown-timer">
                                <div class="countdown-item">
                                    <div class="countdown-item-value" id="countdown-days">00</div>
                                    <div class="countdown-item-label">Days</div>
                                </div>
                                <div class="countdown-item">
                                    <div class="countdown-item-value" id="countdown-hours">00</div>
                                    <div class="countdown-item-label">Hours</div>
                                </div>
                                <div class="countdown-item">
                                    <div class="countdown-item-value" id="countdown-minutes">00</div>
                                    <div class="countdown-item-label">Minutes</div>
                                </div>
                                <div class="countdown-item">
                                    <div class="countdown-item-value" id="countdown-seconds">00</div>
                                    <div class="countdown-item-label">Seconds</div>
                                </div>
                            </div>
                        </div> -->
                <?php endif; ?>
            
            <?php if (!empty($event['eventUrl'])): ?>
                <div class="event-action">
                    <script>
                        // Set CSS variables for primary and darker colors from WordPress customizer
                        document.documentElement.style.setProperty('--primary-color', '<?php echo esc_js(get_theme_mod("primary_color", "#007bff")); ?>');
                        document.documentElement.style.setProperty('--primary-darker-color', '<?php echo esc_js(get_theme_mod("primary_darker_color", "#0056b3")); ?>');
                        document.documentElement.style.setProperty('--primary-color-light', '<?php echo esc_js(get_theme_mod("primary_color_light", "#e6f2ff")); ?>');
                        
                    // Countdown Timer Functionality
                    function updateCountdown() {
                        const eventDate = new Date('<?php 
                            // Combine date and start time if available
                            $countdown_date = !empty($event['startTime']) && $event['startTime'] !== '00:00:00'
                                ? $event['eventDate'] . ' ' . $event['startTime']
                                : $event['eventDate'];
                            echo esc_js($countdown_date); 
                        ?>').getTime();
                        
                        const now = new Date().getTime();
                        const timeLeft = eventDate - now;
                        
                        // Calculate days, hours, minutes, seconds
                        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
                        
                        // Update DOM elements
                        document.getElementById('countdown-days').textContent = days < 10 ? '0' + days : days;
                        document.getElementById('countdown-hours').textContent = hours < 10 ? '0' + hours : hours;
                        document.getElementById('countdown-minutes').textContent = minutes < 10 ? '0' + minutes : minutes;
                        document.getElementById('countdown-seconds').textContent = seconds < 10 ? '0' + seconds : seconds;
                        
                        // Stop countdown if event has passed
                        if (timeLeft < 0) {
                            clearInterval(countdownTimer);
                            document.getElementById('event-countdown-timer').innerHTML = '<div style="color:#666;">Event has started!</div>';
                        }
                    }
                    
                    
                    // Update countdown immediately and then every second
                    const countdownTimer = setInterval(updateCountdown, 1000);
                    updateCountdown(); // Initial call
                    
                    // Function to share event on social media
                    function shareEvent(platform) {
                        const eventTitle = '<?php echo rawurlencode(esc_js($event['title'])); ?>';
                        const eventUrl = '<?php echo rawurlencode(esc_js($event['eventUrl'])); ?>';
                        
                        // Customized sharing URLs that bypass Facebook's sharing restrictions
                        let shareUrl = '';
                        switch(platform) {
                            case 'facebook':
                                shareUrl = `https://www.facebook.com/dialog/share?app_id=YOUR_FACEBOOK_APP_ID&display=popup&href=${eventUrl}&redirect_uri=${eventUrl}`;
                                break;
                            case 'twitter':
                                shareUrl = `https://twitter.com/intent/tweet?text=${eventTitle}&url=${eventUrl}`;
                                break;
                            case 'linkedin':
                                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${eventUrl}`;
                                break;
                            case 'whatsapp':
                                shareUrl = `https://wa.me/?text=${eventTitle}%20${eventUrl}`;
                                break;
                        }
                        
                        window.open(shareUrl, '_blank', 'width=600,height=400');
                    }
                    </script>
                    
                    <button onclick="window.open('<?php echo esc_url($event['eventUrl']); ?>', '_blank')">Register Now</button>
                    
                    <div class="social-share-container">
                        <div class="social-share-label">
                            <i data-lucide="share-2"></i>
                            Share this event
                        </div>
                        <div class="social-share-buttons">
                            <a href="javascript:void(0);" class="facebook" onclick="shareEvent('facebook')">
                                <i class="fab fa-facebook-f"></i>
                            </a>
                            <a href="javascript:void(0);" class="twitter" onclick="shareEvent('twitter')">
                                <i class="fab fa-twitter"></i>
                            </a>
                            <a href="javascript:void(0);" class="linkedin" onclick="shareEvent('linkedin')">
                                <i class="fab fa-linkedin-in"></i>
                            </a>
                            <a href="javascript:void(0);" class="whatsapp" onclick="shareEvent('whatsapp')">
                                <i class="fab fa-whatsapp"></i>
                            </a>
                        </div>
                    </div>
                </div>
            <?php endif; ?>

            <!-- <button 
                onclick="goBack()"
                style="background-color: #f0f0f0; margin-top:25px; color: #333; border: 1px solid #ccc; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 16px; display: flex; align-items: center; gap: 8px;"
            >
                <i class="fas fa-arrow-left"></i> Go Back
            </button>

            <script>
            function goBack() {
                // First try using the referer that was captured server-side
                const serverReferer = '<?php // echo htmlspecialchars($_SERVER['HTTP_REFERER'] ?? ''); ?>';
                
                // If we have a valid referer from the server, use that
                if (serverReferer) {
                    window.location.href = serverReferer;
                } 
                // If not, check if there's history to go back to
                else if (document.referrer || window.history.length > 1) {
                    window.history.back();
                } 
                // If all else fails, go to the home page
                else {
                    window.location.href = '/';
                }
            }
            </script> -->
        </div>
        
        <?php if (!empty($event['image'])): ?>
            <div class="event-image">
                <img src="<?php echo esc_url($event['image']); ?>" alt="<?php echo esc_attr($event['title']); ?>" class="img-fluid">
            </div>
        <?php endif; ?>
    </div>

<script>
    // Initialize Lucide icons
    lucide.createIcons();
</script>


<script>
    // Initialize Lucide icons
    lucide.createIcons();
</script>
    
    <?php
    return ob_get_clean();
}
    
   
add_shortcode('event_detail', 'elc_event_detail_shortcode');

// Create the page template file
function elc_create_page_template() {
    $template_path = plugin_dir_path(__FILE__) . 'templates/event-detail-template.php';
    
    if (!file_exists($template_path)) {
        $template_content = '<?php
/**
 * Template Name: Event Detail Template
 * Description: Template for displaying event details
 */

get_header();
?>

<div class="container">
    <div class="row">
        <div class="col-md-12">
            <?php echo do_shortcode("[event_detail]"); ?>
        </div>
    </div>
</div>



<?php get_footer(); ?>';

        file_put_contents($template_path, $template_content);
    }
}

// Run this on plugin activation
function elc_activate_page_template() {
    elc_create_page_template();
    
    // Check if the events page already exists
    $existing_page = get_page_by_path('events');
    
    if (!$existing_page) {
        // Create a page to display event details
        $page_id = wp_insert_post(array(
            'post_title'     => 'Event Details',
            'post_name'      => 'events',
            'post_status'    => 'publish',
            'post_type'      => 'page',
            'post_content'   => '[event_detail]',
            'page_template'  => 'event-detail-template.php'
        ));
    }
}
register_activation_hook(__FILE__, 'elc_activate_page_template');










add_shortcode('event_listing_calendar', 'elc_shortcode');
?>


