<template>
  <section class="container">
      <header>
        <h1 class="title is-6"><slot name="title"></slot></h1>
      </header>
    <div class="box">
      <article class="message is-small"> 
        <div class="message-body">
          <div class="content">
            <slot name="tip"></slot>
      </div>
        </div>
    </article>
    <slot name="form"></slot>
    </div>
    <div>
        <slot name="results"></slot>
    </div>
</section>
</template>

<script>
export default {

}
</script>

<style lang="scss" scoped>

    .message-body{
        border-color: $success-color;
    }

    header{
        background-color: $light-grey;

        h1 {
            margin-left: 1.25rem;
            padding-top: 10px;
            padding-bottom: 10px;
        }
    }

    .message.is-small {
        font-size: 0.85rem;
    }
</style>