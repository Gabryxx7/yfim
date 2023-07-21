export default function (api) {
   return {
      plugins: [
         'macros',
         [
            "@babel/plugin-transform-runtime",
            {
               "regenerator": true
            }
         ]
      ],
      presets: [
         ['@babel/preset-env', {targets: {node: 'current'}}],
         ['@babel/preset-react', {targets: {node: 'current'}}] // add this
       ]
   }
}