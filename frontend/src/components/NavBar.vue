<template>
  <div class="hero is-info">
  <section class="container">
     <nav class="navbar" role="navigation" aria-label="main navigation">
  <div class="navbar-brand">
    <span class="navbar-item is-size-4 has-text-weight-semibold">HappySoup.io</span>

    <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
      <span aria-hidden="true"></span>
    </a>
  </div>

  <div id="navbarBasicExample" class="navbar-menu">
    <div class="navbar-start">
      <a class="navbar-item">
        Impact Analysis
      </a>

      <a class="navbar-item">
        Deployment Boundaries
      </a>

      <a class="navbar-item">
        Page Layout Dictionary
      </a>

      <a class="navbar-item">
        Apex Bio
      </a>

      <a class="navbar-item">
        Documentation
      </a>

      <div class="navbar-item has-dropdown is-hoverable">
        <a class="navbar-link">
          More
        </a>

        <div class="navbar-dropdown">
          <a class="navbar-item">
            About
          </a>
          <a class="navbar-item">
            Jobs
          </a>
          <a class="navbar-item">
            Contact
          </a>
          <hr class="navbar-divider">
          <a class="navbar-item">
            Report an issue
          </a>
        </div>
      </div>
    </div>

    <div class="navbar-end">
      <div class="navbar-item">
        <div class="buttons">
          <a class="button is-danger">
            Log out
          </a>
        </div>
      </div>
    </div>
  </div>
</nav>
  </section>
  </div>
 
</template>

<script>
export default {
 
}
</script>

<style lang="scss">
.navbar-item{
  font-weight: bold;
}

</style>