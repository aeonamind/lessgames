import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingIncludes: {
    "/api/clueless/daily": ["./src/games/clueless/data/**/*"],
    "/api/clueless/guess": ["./src/games/clueless/data/**/*"],
    "/api/clueless/hint": ["./src/games/clueless/data/**/*"],
  },
};

export default nextConfig;
