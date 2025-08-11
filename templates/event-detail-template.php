<?php
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

<?php get_footer(); ?>