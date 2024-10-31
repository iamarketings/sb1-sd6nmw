const fs = require('fs');
const path = require('path');

class File {
  static STORAGE_LIMIT = 30 * 1024 * 1024 * 1024; // 30 Go en octets

  static async getAllForUser(user) {
    return new Promise((resolve, reject) => {
      try {
        const files = fs.readdirSync(user.directory).map(file => {
          const filePath = path.join(user.directory, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: `/uploads/${path.basename(user.directory)}/${file}`,
            size: stats.size,
            isDirectory: stats.isDirectory(),
            created: stats.birthtime
          };
        });
        resolve(files);
      } catch (error) {
        reject(error);
      }
    });
  }

  static async countUserFiles(user) {
    try {
      const files = await this.getAllForUser(user);
      return files.filter(file => !file.isDirectory).length;
    } catch (error) {
      return 0;
    }
  }

  static async countUserFolders(user) {
    try {
      const files = await this.getAllForUser(user);
      return files.filter(file => file.isDirectory).length;
    } catch (error) {
      return 0;
    }
  }

  static async getTotalStorageUsed(directory) {
    let totalSize = 0;
    
    function calculateSize(dir) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          calculateSize(filePath);
        } else {
          totalSize += stats.size;
        }
      }
    }

    try {
      calculateSize(directory);
      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  static formatSize(bytes) {
    const sizes = ['o', 'Ko', 'Mo', 'Go', 'To'];
    if (bytes === 0) return '0 o';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  }
}

module.exports = File;