<template>
   <div class="info">
    <div class="form-container">
      <iframe 
        src="https://docs.google.com/forms/d/e/1FAIpQLSeJwZImy7LFQ3kttmJ6kKAXdtH-nz1EEff19zjmNlqYTVGqjQ/viewform?embedded=true" 
        height="2847" 
        frameborder="0" 
        marginheight="0" 
        marginwidth="0">
        Loading…
      </iframe>
    </div>
   </div>
</template>

<script>
export default {

}
</script>

<style lang="scss" scoped>

    .info {
        height: 100%;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 10px;
    }

    .form-container {
        width: 100%;
        height: 85vh;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        overflow: hidden;
    }

    iframe {
        width: 100%;
        height: 100%;
        border: none;
    }

    .ad{
        text-align: center;
    }

    .has-text-info{
        color:$alternative-background !important;
    }

    p{
        margin-bottom: 15px;
    }

    .pure-center{
        margin-top:3%;
    }

    .fa-youtube{
        color:rgb(232, 120, 120);
    }

</style>