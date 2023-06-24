pragma circom 2.0.0;

// copied from https://github.com/sigmachirality/empty-house

include "../node_modules/circomlib/circuits/bitify.circom";

// base ^ exponent ===> out   subject to n bits limitation 
template Pow(n) {
    signal input base;
    signal input exponent;
    signal output out;

    component n2b = Num2Bits(n);
    n2b.in <== exponent;
    signal pow[n];
    signal inter[n];
    signal temp[n];

    pow[0] <== base;
    temp[0] <== pow[0] * n2b.out[0] + (1 - n2b.out[0]);
    inter[0] <== temp[0];

    for (var i = 1; i < n; i++) {
        pow[i] <== pow[i-1] * pow[i-1];
        temp[i] <== pow[i] * n2b.out[i] + (1 - n2b.out[i]);
        inter[i] <==  inter[i-1] * temp[i];
    }

    out <== inter[n-1];
}


// Multiplies Matrix A of size m x n by Matrix B of size n x p, producing Matrix AB of size m x p
template ScalarMatrixMul(m, n, p) {
    signal input A[m][n];
    signal input B[n][p];
    signal output AB[m][p];
    signal intermediates[m][p][n];
    for(var row = 0; row < m; row++) {
      for(var col = 0; col < p; col++) {
        var sum = 0;
        for(var i = 0; i < n; i++) {
          intermediates[row][col][i] <== A[row][i] * B[i][col];
          sum += intermediates[row][col][i];
        }
        AB[row][col] <== sum; 
      }
    }
}


template PermutationConstraint(n) {
    signal input permutation_matrix[n][n]; // permutation matrix to shuffle the deck
    
    // declaration of signals    
    component ElementBooleanConstraints[n][n];
    for (var i = 0; i < n; i++) {
        for (var j = 0; j < n; j++) {
            0 === permutation_matrix[i][j] * (permutation_matrix[i][j] - 1); // c is 0 or 1;
        }
    }

    // Check that each row sums to 1
    var accum = 0;
    for (var i = 0; i < n; i++) {
        accum = 0;
        for (var j = 0; j < n; j++) {
            accum += permutation_matrix[i][j];
        }
        1 === accum;
    }

    // Check that each col sums to 1
    for (var j = 0; j < n; j++) {
        accum = 0;
        for (var i = 0; i < n; i++) {
            accum += permutation_matrix[i][j];
        }
        1 === accum;
    }
}


template Adder(n) {
    signal input numbers[n];
    signal temp[n];
    signal output total;

    if (n == 1) {
        total <== numbers[0];
    } else {
        temp[0] <== numbers[0];
        for (var i=1; i<n-1; i++) {
            temp[i] <== temp[i-1] + numbers[i];
        }
        total <== temp[n-2] + numbers[n-1];
    }
}


