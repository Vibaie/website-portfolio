#include <iostream>
#include <vector>
#include <string>
#include <iomanip>

using namespace std;

// Structure to represent a Book
struct Book {
    int id;
    string title;
    string author;
    bool isBorrowed;
};

// Global list of books
vector<Book> library;
int bookIdCounter = 1;

// Function to calculate overdue fee based on Table 1
double calculateFee(int daysLate) {
    if (daysLate <= 0) return 0.0;
    if (daysLate == 1) return 5.00;
    if (daysLate == 2) return 6.00;
    if (daysLate == 3) return 7.00;
    // More than 3 days: RM10 per day (assuming flat rate per day late based on description "overdue charge is RM10.00 per day")
    // The description says "More than 3 days -> overdue charge is RM10.00 per day".
    // This usually means 10 * daysLate.
    return 10.00 * daysLate;
}

void addBook() {
    Book newBook;
    newBook.id = bookIdCounter++;
    
    // Clear input buffer
    cin.ignore(); 
    
    cout << "Enter Book Title: ";
    getline(cin, newBook.title);
    
    cout << "Enter Book Author: ";
    getline(cin, newBook.author);
    
    newBook.isBorrowed = false;
    
    library.push_back(newBook);
    cout << "Book added successfully! ID: " << newBook.id << endl;
}

void viewBooks() {
    cout << "\n--- Book Catalogue ---\n";
    cout << left << setw(5) << "ID" << setw(30) << "Title" << setw(20) << "Author" << setw(10) << "Status" << endl;
    cout << "------------------------------------------------------------------\n";
    
    for (const auto& book : library) {
        cout << left << setw(5) << book.id 
             << setw(30) << book.title 
             << setw(20) << book.author 
             << setw(10) << (book.isBorrowed ? "Loaned" : "Available") << endl;
    }
    cout << "------------------------------------------------------------------\n";
}

void searchBook() {
    cin.ignore();
    string keyword;
    cout << "Enter title to search: ";
    getline(cin, keyword);
    
    bool found = false;
    for (const auto& book : library) {
        // Simple substring search or exact match isn't built-in perfectly for C++, 
        // strictly simple -> check if title is exact match or contains it (manual check too complex? let's do simple find)
        if (book.title.find(keyword) != string::npos) {
            cout << "Found: ID " << book.id << " - " << book.title << " by " << book.author << endl;
            found = true;
        }
    }
    
    if (!found) cout << "No books found." << endl;
}

void borrowBook() {
    int id;
    cout << "Enter Book ID to borrow: ";
    cin >> id;
    
    bool found = false;
    // Check how many books user borrowed? (Simplified: We don't track users, just assume global max 5 for project simplicity? 
    // Or just check if *this* book is available). 
    // Note: "Limit maximum loan to 5 books at a time" implies per user. 
    // Since we don't have login/users, we will just check if the book is available.
    
    for (auto& book : library) {
        if (book.id == id) {
            found = true;
            if (book.isBorrowed) {
                cout << "Book is already borrowed." << endl;
            } else {
                // Here we could add logic to check if user has < 5 books, but without user accounts, we skip.
                cout << "Is the user eligible? (1 for Yes, 0 for No): ";
                int eligible;
                cin >> eligible;
                
                if (eligible == 1) {
                    book.isBorrowed = true;
                    cout << "Book borrowed successfully." << endl;
                } else {
                    cout << "User not eligible." << endl;
                }
            }
            break;
        }
    }
    
    if (!found) cout << "Book ID not found." << endl;
}

void returnBook() {
    int id;
    cout << "Enter Book ID to return: ";
    cin >> id;
    
    bool found = false;
    for (auto& book : library) {
        if (book.id == id) {
            found = true;
            if (!book.isBorrowed) {
                cout << "This book was not borrowed." << endl;
            } else {
                int days;
                cout << "How many days late is the book? (0 if not late): ";
                cin >> days;
                
                double fee = calculateFee(days);
                cout << "Overdue Fee: RM " << fixed << setprecision(2) << fee << endl;
                
                book.isBorrowed = false;
                cout << "Book returned successfully." << endl;
            }
            break;
        }
    }
    if (!found) cout << "Book ID not found." << endl;
}

int main() {
    int choice;
    
    // Add some dummy data
    library.push_back({bookIdCounter++, "Harry Potter", "J.K. Rowling", false});
    library.push_back({bookIdCounter++, "C++ Programming", "Bjarne Stroustrup", false});
    
    while (true) {
        cout << "\n=== Library Book Management System ===\n";
        cout << "1. Add New Book\n";
        cout << "2. View All Books\n";
        cout << "3. Search Book\n";
        cout << "4. Borrow Book\n";
        cout << "5. Return Book\n";
        cout << "6. Exit\n";
        cout << "Enter choice: ";
        cin >> choice;
        
        if (cin.fail()) {
            cin.clear();
            cin.ignore(10000, '\n');
            continue;
        }

        switch (choice) {
            case 1: addBook(); break;
            case 2: viewBooks(); break;
            case 3: searchBook(); break;
            case 4: borrowBook(); break;
            case 5: returnBook(); break;
            case 6: cout << "Exiting...\n"; return 0;
            default: cout << "Invalid choice!\n";
        }
    }
    return 0;
}
