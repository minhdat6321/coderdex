const listFilesInFolder = require('./path/to/your/module');

const myFolderPath = './img_index';

// Using async/await
(async () => {
  try {
    const files = await listFilesInFolder(myFolderPath);
    console.log(files); // Outputs: ['1', '2', '10', '100', '101', ...]
  } catch (err) {
    console.error('Error:', err);
  }
})();

// Or using .then()
listFilesInFolder(myFolderPath)
  .then(files => console.log(files)) // Outputs: ['1', '2', '10', '100', '101', ...]
  .catch(err => console.error('Error:', err));
