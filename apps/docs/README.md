# Hebo Documentation

This is the documentation site for Hebo, built with Next.js and Nextra.

## Search Integration

This site uses [Pagefind](https://pagefind.app/) for search functionality. Pagefind is integrated as an npm dependency and is automatically built during the site's build process.

### How it works

1. Pagefind is installed as a dependency via npm:
   ```json
   {
     "dependencies": {
       "pagefind": "^1.0.4",
       "@pagefind/default-ui": "^1.3.0"
     }
   }
   ```

2. The search index is automatically generated during the build process using the `postbuild` script in package.json:
   ```json
   {
     "scripts": {
       "postbuild": "pagefind --site .next/server/app --output-path public/_pagefind"
     }
   }
   ```

3. The search UI is provided by `@pagefind/default-ui` package.

### Customization

The search functionality can be customized by modifying the Pagefind configuration in your code. Refer to the [Pagefind documentation](https://pagefind.app/docs/) for available options.
