import babel from "@rollup/plugin-babel";
import { dts } from 'rollup-plugin-dts';

const input = ['src/index.ts', 'src/world.ts', 'src/systems.ts'];
const plugins = [
  babel({
    presets: ["@babel/preset-env", ["@babel/preset-typescript", {}]],
    extensions: [".js", ".ts"]
  }),
];
export default [{
	input,
	output: {
		dir: "dist",
		format: 'cjs',
    chunkFileNames: "[name].cjs",
    assetFileNames: "[name].cjs",
    entryFileNames: "[name].cjs",
	},
  plugins,
}, {
  input,
  output: {
    dir: "dist",
    format: 'esm',
    chunkFileNames: "[name].mjs",
    assetFileNames: "[name].mjs",
    entryFileNames: "[name].mjs"
  },
  plugins,
}, {
  input: 'src/index.ts',
  output: [{file: 'dist/index.d.ts'}],
  plugins: [dts()]
}];