// Script para diagnosticar la cámara desde consola del navegador
// Ejecutar en DevTools después de cargar el juego

function debugCamera() {
  const game = window.game;
  if (!game) {
    console.log("❌ Game object no encontrado");
    return;
  }

  const scene = game.scene.getScene('MainScene');
  if (!scene) {
    console.log("❌ MainScene no encontrada");
    return;
  }

  const camera = scene.cameras.main;
  const worldBounds = camera._bounds;

  console.log("🎥 === ANÁLISIS COMPLETO DE CÁMARA ===");
  console.log("📊 Dimensiones de pantalla:");
  console.log(`  - Game: ${game.config.width}x${game.config.height}`);
  console.log(`  - Camera viewport: ${camera.width}x${camera.height}`);
  console.log(`  - Display size: ${camera.displayWidth}x${camera.displayHeight}`);
  
  console.log("🌍 Configuración del mundo:");
  console.log(`  - Bounds: x=${worldBounds.x}, y=${worldBounds.y}, w=${worldBounds.width}, h=${worldBounds.height}`);
  
  console.log("📍 Posición actual de cámara:");
  console.log(`  - Scroll: x=${camera.scrollX}, y=${camera.scrollY}`);
  console.log(`  - Zoom: ${camera.zoom}`);
  console.log(`  - Center: x=${camera.centerX}, y=${camera.centerY}`);
  
  console.log("🔍 Área visible:");
  const viewWidth = camera.width / camera.zoom;
  const viewHeight = camera.height / camera.zoom;
  console.log(`  - Effective view: ${viewWidth}x${viewHeight}`);
  console.log(`  - World coverage: ${((viewWidth * viewHeight) / (worldBounds.width * worldBounds.height) * 100).toFixed(1)}%`);
  
  console.log("⚡ Límites calculados:");
  const maxScrollX = Math.max(0, worldBounds.width - viewWidth);
  const maxScrollY = Math.max(0, worldBounds.height - viewHeight);
  console.log(`  - Max scroll: x=${maxScrollX}, y=${maxScrollY}`);
  console.log(`  - Current scroll %: x=${((camera.scrollX / maxScrollX) * 100).toFixed(1)}%, y=${((camera.scrollY / maxScrollY) * 100).toFixed(1)}%`);
  
  console.log("🎯 Pruebas de navegación:");
  console.log("  - Ejecutar: testCameraMovement()");
}

function testCameraMovement() {
  const game = window.game;
  const scene = game.scene.getScene('MainScene');
  const camera = scene.cameras.main;
  
  console.log("🧪 === PRUEBA DE MOVIMIENTO ===");
  
  // Test esquina superior izquierda
  camera.setScroll(0, 0);
  console.log(`📍 Esquina superior izquierda: ${camera.scrollX}, ${camera.scrollY}`);
  
  setTimeout(() => {
    // Test esquina inferior derecha
    const maxX = camera._bounds.width - (camera.width / camera.zoom);
    const maxY = camera._bounds.height - (camera.height / camera.zoom);
    camera.setScroll(maxX, maxY);
    console.log(`📍 Esquina inferior derecha: ${camera.scrollX}, ${camera.scrollY}`);
    
    setTimeout(() => {
      // Test centro
      camera.centerOn(camera._bounds.width / 2, camera._bounds.height / 2);
      console.log(`📍 Centro: ${camera.scrollX}, ${camera.scrollY}`);
      
      console.log("✅ Prueba completada - revisar si la cámara se movió correctamente");
    }, 1000);
  }, 1000);
}

// Auto-ejecutar cuando se carga
setTimeout(() => {
  debugCamera();
}, 2000);