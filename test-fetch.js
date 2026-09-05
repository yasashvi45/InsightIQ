try {
  fetch('/api/datasets/download?userId=123&storagePath=abc');
  console.log('Success');
} catch (e) {
  console.log('Error:', e.message);
}
