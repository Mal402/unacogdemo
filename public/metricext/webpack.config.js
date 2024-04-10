module.exports = {
    entry: {
        'index': './index.ts',
        'service-worker': './service-worker.ts',
    },
    output: {
        path: __dirname + '/models',
        filename: '[name].js'
    },
    mode: 'development',
    devtool: 'source-map',
    resolveLoader: {
      modules: [
        __dirname + '/node_modules'
      ]
    },
    resolve: {
      modules: [
        __dirname + '/node_modules'
      ],
      extensions: ['.ts', '.js', '.jsx']
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: 'ts-loader'
        },
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader'
          }
        },
      ]
    },
    node: {
      global: true
    }
  };