const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// The block ends around here:
//       } catch (e) {
//         if (!resolved) {
//           resolved = true;
//           clearTimeout(timeout);
//           reject(e);
//         }
//       }
//     });
//   }

code = code.replace(/      \} catch \(e\) \{\n        if \(\!resolved\) \{\n          resolved \= true;\n          clearTimeout\(timeout\);\n          reject\(e\);\n        \}\n      \}\n    \}\);\n  \}/m, 
    `      } catch (e) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          reject(e);
        }
      }
      })().catch(reject);
    });
  }`);

fs.writeFileSync('server.ts', code);
